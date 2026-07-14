import "server-only";

import {
  buildFallbackRiskSuggestion,
  buildProviderRiskSuggestion,
  buildRiskSuggestionPrompt,
  type AIRiskSuggestionResult,
  type AIRecommendationProvider,
  type RiskSuggestionInput,
  type RiskSuggestionPrompt,
} from "@/lib/ai/risk-recommendation";

type ConfiguredProvider = Exclude<AIRecommendationProvider, "fallback">;

const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_OPENROUTER_MODEL = "openrouter/free";

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

function normalizeText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseJsonObjectFromText(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const firstBrace = withoutFence.indexOf("{");
  const lastBrace = withoutFence.lastIndexOf("}");
  const candidate =
    firstBrace >= 0 && lastBrace > firstBrace
      ? withoutFence.slice(firstBrace, lastBrace + 1)
      : withoutFence;

  try {
    return asRecord(JSON.parse(candidate));
  } catch {
    return null;
  }
}

function extractTextFromContentParts(value: unknown): string | null {
  const directText = normalizeText(value);
  if (directText) return directText;

  const contentRecord = asRecord(value);
  if (contentRecord) {
    return (
      normalizeText(contentRecord.text) ??
      normalizeText(contentRecord.content)
    );
  }

  if (!Array.isArray(value)) return null;

  const parts = value
    .map((part) => {
      const textPart = normalizeText(part);
      if (textPart) return textPart;

      const partRecord = asRecord(part);
      return (
        normalizeText(partRecord?.text) ??
        normalizeText(partRecord?.content)
      );
    })
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join("\n").trim() : null;
}

function extractOpenRouterErrorMessage(payload: unknown): string | null {
  const error = asRecord(asRecord(payload)?.error);
  const message = normalizeText(error?.message);
  if (!message) return null;

  return message.slice(0, 180);
}

function describeOpenRouterPayload(payload: unknown) {
  const record = asRecord(payload);
  const choices = record?.choices;
  const firstChoice = Array.isArray(choices) ? asRecord(choices[0]) : null;
  const message = asRecord(firstChoice?.message);
  const content = message?.content;
  const contentRecord = asRecord(content);
  const firstPart = Array.isArray(content) ? asRecord(content[0]) : null;
  const publicKeys = (value: Record<string, unknown> | null) =>
    value
      ? Object.keys(value)
          .filter((key) => !key.toLowerCase().startsWith("reasoning"))
          .sort()
      : [];

  return {
    hasChoices: Array.isArray(choices),
    choicesCount: Array.isArray(choices) ? choices.length : 0,
    firstChoiceKeys: publicKeys(firstChoice),
    messageKeys: publicKeys(message),
    contentType: Array.isArray(content) ? "array" : typeof content,
    contentObjectKeys: contentRecord ? publicKeys(contentRecord) : [],
    contentPartCount: Array.isArray(content) ? content.length : 0,
    firstPartKeys: publicKeys(firstPart),
    choiceTextType: typeof firstChoice?.text,
    hasErrorMessage: Boolean(extractOpenRouterErrorMessage(payload)),
    hasReasoningMetadata: Boolean(
      message &&
        Object.keys(message).some((key) =>
          key.toLowerCase().startsWith("reasoning"),
        ),
    ),
  };
}

function extractOpenRouterText(payload: unknown): string | null {
  const record = asRecord(payload);
  const choices = record?.choices;
  if (!Array.isArray(choices)) return null;

  const firstChoice = asRecord(choices[0]);
  const message = asRecord(firstChoice?.message);

  return (
    extractTextFromContentParts(message?.content) ??
    normalizeText(firstChoice?.text)
  );
}

async function requestOpenRouterText(
  prompt: RiskSuggestionPrompt,
  model: string,
): Promise<string | null> {
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
        "X-OpenRouter-Title": "VocaSafe Lab",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: prompt.systemInstruction,
          },
          { role: "user", content: prompt.userData },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    },
  );

  const payload = await readJson(response);

  if (!response.ok) {
    const errorMessage = extractOpenRouterErrorMessage(payload);
    throw new Error(
      errorMessage
        ? `OpenRouter request failed: ${response.status} ${errorMessage}`
        : `OpenRouter request failed: ${response.status}`,
    );
  }

  const text = extractOpenRouterText(payload);
  if (!text) {
    console.error("[AI Risk Recommendation] OpenRouter response missing text", {
      provider: "openrouter",
      model,
      status: response.status,
      shape: describeOpenRouterPayload(payload),
    });
  }

  return text;
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

async function generateOpenAi(prompt: RiskSuggestionPrompt): Promise<string> {
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
          content: prompt.systemInstruction,
        },
        { role: "user", content: prompt.userData },
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

async function generateDeepSeek(prompt: RiskSuggestionPrompt): Promise<string> {
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
          content: prompt.systemInstruction,
        },
        { role: "user", content: prompt.userData },
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

async function generateOpenRouter(prompt: RiskSuggestionPrompt): Promise<string> {
  const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
  const text =
    (await requestOpenRouterText(prompt, model)) ??
    (model === DEFAULT_OPENROUTER_MODEL
      ? null
      : await requestOpenRouterText(prompt, DEFAULT_OPENROUTER_MODEL));

  if (!text) throw new Error("OpenRouter response did not include text.");

  return text;
}

async function generateGemini(prompt: RiskSuggestionPrompt): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: prompt.systemInstruction }],
        },
        contents: [{ parts: [{ text: prompt.userData }] }],
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
  prompt: RiskSuggestionPrompt,
): Promise<string> {
  if (provider === "openai") return generateOpenAi(prompt);
  if (provider === "gemini") return generateGemini(prompt);
  if (provider === "openrouter") return generateOpenRouter(prompt);
  return generateDeepSeek(prompt);
}

export async function generateRiskRecommendation(
  input: RiskSuggestionInput,
): Promise<AIRiskSuggestionResult> {
  const fallback = buildFallbackRiskSuggestion(input);
  const provider = configuredProvider();

  if (!provider) return fallback;

  try {
    const text = await generateWithProvider(
      provider,
      buildRiskSuggestionPrompt(input),
    );
    const payload = parseJsonObjectFromText(text);
    const suggestion = buildProviderRiskSuggestion(input, provider, payload);

    return suggestion ?? fallback;
  } catch (error) {
    console.error("[AI Risk Recommendation] provider failed", error);
    return fallback;
  }
}
