import type { ChecklistResponse, RiskScoringInput, RiskScoringResult } from "../types";

const CHECKLIST_KEY = "vocasafe_checklist_results";

export interface ChecklistResult {
  id: string;
  checklistId: string;
  assetId: string;
  inspectorUserId: string;
  completedAt: string;
  responses: ChecklistResponse[];
  overallNote: string;
  hasRiskFinding?: boolean;
  riskInput?: RiskScoringInput;
  riskResult?: RiskScoringResult;
}

export function getChecklistResults(): ChecklistResult[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CHECKLIST_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ChecklistResult[];
  } catch {
    return [];
  }
}

export function saveChecklistResult(result: ChecklistResult): void {
  if (typeof window === "undefined") return;
  const existing = getChecklistResults();
  existing.push(result);
  localStorage.setItem(CHECKLIST_KEY, JSON.stringify(existing));
}
