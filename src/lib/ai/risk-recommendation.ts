import "server-only";

import { getRiskCategory } from "@/lib/risk-scoring";
import type { RiskLevel } from "@/types";

export type AIRecommendationProvider =
  | "fallback"
  | "openai"
  | "gemini"
  | "deepseek"
  | "openrouter";

export type AIRecommendationSource = "report" | "checklist";

export interface RiskRecommendationInput {
  source: AIRecommendationSource;
  title: string;
  description: string;
  assetName: string | null;
  location: string | null;
  severity: number;
  probability: number;
  exposure: number;
  riskScore: number;
  riskCategory: RiskLevel;
}

export interface AIRecommendationResult {
  recommendation: string;
  provider: AIRecommendationProvider;
  riskScore: number;
  riskCategory: RiskLevel;
}

const VALID_SOURCES = new Set<AIRecommendationSource>(["report", "checklist"]);
const VALID_RISK_CATEGORIES = new Set<RiskLevel>([
  "rendah",
  "sedang",
  "tinggi",
  "kritis",
]);

const TITLE_MAX_LENGTH = 160;
const DESCRIPTION_MAX_LENGTH = 1200;
const CONTEXT_MAX_LENGTH = 160;

const FALLBACK_RECOMMENDATIONS: Record<RiskLevel, string> = {
  rendah: "Pantau kondisi secara berkala dan dokumentasikan hasil pemeriksaan.",
  sedang:
    "Jadwalkan pemeriksaan oleh teknisi atau laboran dan lakukan tindakan pencegahan.",
  tinggi:
    "Batasi penggunaan alat atau area sampai dilakukan pemeriksaan dan tindakan perbaikan.",
  kritis:
    "Hentikan penggunaan alat atau area sampai diperiksa dan diperbaiki oleh teknisi.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeRequiredString(
  value: unknown,
  label: string,
  maxLength: number,
): { value: string; error: string | null } {
  if (typeof value !== "string") {
    return { value: "", error: `${label} harus berupa teks.` };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { value: "", error: `${label} wajib diisi.` };
  }

  if (trimmed.length > maxLength) {
    return {
      value: "",
      error: `${label} maksimal ${maxLength} karakter.`,
    };
  }

  return { value: trimmed, error: null };
}

function normalizeOptionalString(
  value: unknown,
  label: string,
): { value: string | null; error: string | null } {
  if (value === null || value === undefined) return { value: null, error: null };
  if (typeof value !== "string") {
    return { value: null, error: `${label} harus berupa teks atau null.` };
  }

  const trimmed = value.trim();
  if (!trimmed) return { value: null, error: null };
  if (trimmed.length > CONTEXT_MAX_LENGTH) {
    return {
      value: null,
      error: `${label} maksimal ${CONTEXT_MAX_LENGTH} karakter.`,
    };
  }

  return { value: trimmed, error: null };
}

function isScaleValue(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

export function validateRiskRecommendationInput(body: unknown):
  | { input: RiskRecommendationInput; error: null }
  | { input: null; error: string } {
  if (!isRecord(body)) {
    return { input: null, error: "Body request harus berupa JSON object." };
  }

  if (typeof body.source !== "string" || !VALID_SOURCES.has(body.source as AIRecommendationSource)) {
    return { input: null, error: "source harus bernilai report atau checklist." };
  }

  const title = normalizeRequiredString(body.title, "title", TITLE_MAX_LENGTH);
  if (title.error) return { input: null, error: title.error };

  const description = normalizeRequiredString(
    body.description,
    "description",
    DESCRIPTION_MAX_LENGTH,
  );
  if (description.error) return { input: null, error: description.error };

  const assetName = normalizeOptionalString(body.assetName, "assetName");
  if (assetName.error) return { input: null, error: assetName.error };

  const location = normalizeOptionalString(body.location, "location");
  if (location.error) return { input: null, error: location.error };

  if (!isScaleValue(body.severity)) {
    return { input: null, error: "severity harus berupa integer 1 sampai 5." };
  }

  if (!isScaleValue(body.probability)) {
    return { input: null, error: "probability harus berupa integer 1 sampai 5." };
  }

  if (!isScaleValue(body.exposure)) {
    return { input: null, error: "exposure harus berupa integer 1 sampai 5." };
  }

  const riskScore = body.severity * body.probability * body.exposure;
  if (body.riskScore !== riskScore) {
    return {
      input: null,
      error: "riskScore harus sama dengan severity x probability x exposure.",
    };
  }

  const riskCategory = getRiskCategory(riskScore);
  if (
    typeof body.riskCategory !== "string" ||
    !VALID_RISK_CATEGORIES.has(body.riskCategory as RiskLevel) ||
    body.riskCategory !== riskCategory
  ) {
    return { input: null, error: "riskCategory tidak sesuai threshold skor risiko." };
  }

  return {
    input: {
      source: body.source as AIRecommendationSource,
      title: title.value,
      description: description.value,
      assetName: assetName.value,
      location: location.value,
      severity: body.severity,
      probability: body.probability,
      exposure: body.exposure,
      riskScore,
      riskCategory,
    },
    error: null,
  };
}

export function buildFallbackRiskRecommendation(
  input: RiskRecommendationInput,
): AIRecommendationResult {
  const context = [
    input.title,
    input.assetName ? `aset ${input.assetName}` : null,
    input.location ? `lokasi ${input.location}` : null,
  ]
    .filter(Boolean)
    .join(" pada ");

  const contextSentence = context
    ? `Konteks yang perlu ditinjau: ${context}.`
    : "Tinjau konteks laporan sebelum menetapkan tindak lanjut final.";

  return {
    recommendation: `${FALLBACK_RECOMMENDATIONS[input.riskCategory]} ${contextSentence}`,
    provider: "fallback",
    riskScore: input.riskScore,
    riskCategory: input.riskCategory,
  };
}

export function buildRiskRecommendationPrompt(
  input: RiskRecommendationInput,
): string {
  return [
    "Anda adalah asisten K3 untuk laboratorium vokasi.",
    "Berikan rekomendasi tindak lanjut dalam Bahasa Indonesia, maksimal 3-5 kalimat.",
    "Jangan mengubah, menghitung ulang, atau mempertanyakan risk score dan kategori risiko.",
    "Jangan membuat klaim inspeksi atau fakta teknis yang tidak ada di input.",
    "Fokus pada tindakan K3 praktis dan tekankan bahwa keputusan final tetap perlu review manusia.",
    `Sumber: ${input.source}`,
    `Judul: ${input.title}`,
    `Deskripsi: ${input.description}`,
    `Aset: ${input.assetName ?? "Tidak disebutkan"}`,
    `Lokasi: ${input.location ?? "Tidak disebutkan"}`,
    `Severity: ${input.severity}`,
    `Probability: ${input.probability}`,
    `Exposure: ${input.exposure}`,
    `Risk score final: ${input.riskScore}`,
    `Kategori risiko final: ${input.riskCategory}`,
  ].join("\n");
}

export function normalizeProviderRecommendation(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 900);
}
