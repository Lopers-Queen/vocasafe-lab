import type {
  ControlCondition,
  RiskLevel,
  RiskScoringInput,
  RiskScoringResult,
} from "../types";

const CONTROL_MODIFIERS: Record<ControlCondition, number> = {
  efektif: 0,
  sebagian: 2,
  tidak_ada: 4,
};

const RECOMMENDATIONS: Record<RiskLevel, string> = {
  rendah:
    "Lanjutkan aktivitas dengan kontrol yang ada dan pantau pada inspeksi rutin.",
  sedang:
    "Jadwalkan tindakan korektif dan pastikan kontrol tambahan diterapkan.",
  tinggi:
    "Batasi penggunaan area atau alat, lalu lakukan perbaikan sesegera mungkin.",
  kritis:
    "Hentikan penggunaan area atau alat, amankan lokasi, dan eskalasi segera.",
};

function assertScaleValue(label: string, value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new RangeError(`${label} harus berupa bilangan bulat antara 1 dan 5.`);
  }
}

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 4) return "rendah";
  if (score <= 9) return "sedang";
  if (score <= 16) return "tinggi";
  return "kritis";
}

export function calculateRiskScore(
  input: RiskScoringInput,
): RiskScoringResult {
  assertScaleValue("Severity", input.severity);
  assertScaleValue("Likelihood", input.likelihood);

  const baseScore = input.severity * input.likelihood;
  const modifier =
    CONTROL_MODIFIERS[input.controlCondition] + (input.isRecurring ? 2 : 0);
  const score = Math.min(25, baseScore + modifier);
  const level = getRiskLevel(score);

  return {
    baseScore,
    modifier,
    score,
    level,
    recommendation: RECOMMENDATIONS[level],
  };
}
