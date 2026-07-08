import { NextResponse } from "next/server";

import { generateRiskRecommendation } from "@/lib/ai/provider";
import { validateRiskRecommendationInput } from "@/lib/ai/risk-recommendation";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body request harus berupa JSON valid." },
      { status: 400 },
    );
  }

  const validation = validateRiskRecommendationInput(body);
  if (validation.error || !validation.input) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  return NextResponse.json(await generateRiskRecommendation(validation.input));
}
