import { NextResponse } from "next/server";

import { generateRiskRecommendation } from "@/lib/ai/provider";
import { consumeAiRateLimit } from "@/lib/ai/rate-limit";
import { validateRiskRecommendationInput } from "@/lib/ai/risk-recommendation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function errorResponse(
  error: string,
  status: 400 | 401 | 403 | 429 | 500,
  headers?: Record<string, string>,
) {
  return NextResponse.json(
    { error },
    { status, headers: { ...NO_STORE_HEADERS, ...headers } },
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return errorResponse("Sesi login diperlukan.", 401);
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id,is_active")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[AI Risk Recommendation] profile query failed", {
        code: profileError.code ?? "unknown",
      });
      return errorResponse("Layanan rekomendasi sedang tidak tersedia.", 500);
    }

    if (!profile || profile.is_active !== true) {
      return errorResponse("Profil tidak aktif atau tidak tersedia.", 403);
    }

    const rateLimit = await consumeAiRateLimit(supabase);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Batas permintaan AI tercapai. Coba lagi nanti.",
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            ...NO_STORE_HEADERS,
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Request rekomendasi tidak valid.", 400);
    }

    const validation = validateRiskRecommendationInput(body);
    if (validation.error || !validation.input) {
      return errorResponse("Request rekomendasi tidak valid.", 400);
    }

    const result = await generateRiskRecommendation(validation.input);
    return NextResponse.json(result, { headers: NO_STORE_HEADERS });
  } catch {
    console.error("[AI Risk Recommendation] request failed");
    return errorResponse("Layanan rekomendasi sedang tidak tersedia.", 500);
  }
}
