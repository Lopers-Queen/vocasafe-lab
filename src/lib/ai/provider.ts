import "server-only";

import {
  buildFallbackRiskRecommendation,
  buildRiskRecommendationPrompt,
  normalizeProviderRecommendation,
  type AIRecommendationProvider,
  type AIRecommendationResult,
  type RiskRecommendationInput,
} from "@/lib/ai/risk-recommendation";

type ConfiguredProvider = Exclude<AIRecommendationProvider, "fallback">;

const REQUEST_TIMEOUT_MS = 10_000;

function configuredProvider(): ConfiguredProvider | null {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (
    provider === "openai" ||
    provider === "gemini" ||
    provider === "deepseek" ||
    provider === "openrouter"
  ) {
    return provider;
  }

  return null;
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function extractOpenAiText(payload: unknown): string | null {
  const record = asRecord(payload);
  const choices = record?.choices;
  if (!Array.isArray(choices)) return null;

  const firstChoice = asRecord(choices[0]);
  const message = asRecord(firstChoice?.message);
  return typeof message?.content === "string" ? message.content : null;
}

function extractGeminiText(payload: unknown): string | null {
  const record = asRecord(payload);
  const candidates = record?.candidates;
  if (!Array.isArray(candidates)) return null;

  const firstCandidate = asRecord(candidates[0]);
  const content = asRecord(firstCandidate?.content);
  const parts = content?.parts;
  if (!Array.isArray(parts)) return null;

  const firstPart = asRecord(parts[0]);
  return typeof firstPart?.text === "string" ? firstPart.text : null;
}

async function generateOpenAi(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Anda memberi rekomendasi K3 singkat. Jangan mengubah skor risiko.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 240,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
  const text = extractOpenAiText(await readJson(response));
  if (!text) throw new Error("OpenAI response did not include text.");
  return text;
}

async function generateDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured.");

  const response = await fetchWithTimeout("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "Anda memberi rekomendasi K3 singkat. Jangan mengubah skor risiko.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 240,
    }),
  });

  if (!response.ok) throw new Error(`DeepSeek request failed: ${response.status}`);
  const text = extractOpenAiText(await readJson(response));
  if (!text) throw new Error("DeepSeek response did not include text.");
  return text;
}

async function generateOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured.");

  const response = await fetchWithTimeout(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vocasafe-lab.vercel.app",
        "X-Title": "VocaSafe Lab",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "tencent/hy3:free",
        messages: [
          {
            role: "system",
            content:
              "Anda memberi rekomendasi K3 singkat. Jangan mengubah skor risiko.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status}`);
  }

  const text = extractOpenAiText(await readJson(response));
  if (!text) throw new Error("OpenRouter response did not include text.");
  return text;
}

async function generateGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 240,
        },
      }),
    },
  );

  if (!response.ok) throw new Error(`Gemini request failed: ${response.status}`);
  const text = extractGeminiText(await readJson(response));
  if (!text) throw new Error("Gemini response did not include text.");
  return text;
}

async function generateWithProvider(
  provider: ConfiguredProvider,
  prompt: string,
): Promise<string> {
  if (provider === "openai") return generateOpenAi(prompt);
  if (provider === "gemini") return generateGemini(prompt);
  if (provider === "openrouter") return generateOpenRouter(prompt);
  return generateDeepSeek(prompt);
}

export async function generateRiskRecommendation(
  input: RiskRecommendationInput,
): Promise<AIRecommendationResult> {
  const fallback = buildFallbackRiskRecommendation(input);
  const provider = configuredProvider();

  if (!provider) return fallback;

  try {
    const recommendation = normalizeProviderRecommendation(
      await generateWithProvider(provider, buildRiskRecommendationPrompt(input)),
    );

    if (!recommendation) return fallback;

    return {
      recommendation,
      provider,
      riskScore: input.riskScore,
      riskCategory: input.riskCategory,
    };
  } catch (error) {
    console.error("[AI Risk Recommendation] provider failed", error);
    return fallback;
  }
}
