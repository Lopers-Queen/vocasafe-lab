import type { HazardReport } from "../types";
import { dummyReports } from "../data/dummy-data";

const REPORTS_KEY = "vocasafe_reports";

/** Read user-created reports from localStorage */
export function getLocalReports(): HazardReport[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(REPORTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as HazardReport[];
  } catch {
    return [];
  }
}

/** Save user-created reports to localStorage */
export function saveLocalReports(reports: HazardReport[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

/** Add a single report to localStorage */
export function addLocalReport(report: HazardReport): void {
  const existing = getLocalReports();
  existing.push(report);
  saveLocalReports(existing);
}

/**
 * Get all reports: dummy + localStorage, merged.
 * localStorage overrides dummy if same ID.
 */
export function getAllReports(): HazardReport[] {
  const local = getLocalReports();
  const localIds = new Set(local.map((r) => r.id));
  const fromDummy = dummyReports.filter((r) => !localIds.has(r.id));
  return [...fromDummy, ...local];
}

/** Update a single report (in localStorage).
 *  If the report is a dummy, copies it to localStorage first. */
export function updateReport(
  reportId: string,
  updater: (report: HazardReport) => HazardReport,
): void {
  const local = getLocalReports();
  const idx = local.findIndex((r) => r.id === reportId);

  if (idx >= 0) {
    local[idx] = updater(local[idx]);
    saveLocalReports(local);
  } else {
    // It may be a dummy report — copy it to local storage with update
    const dummy = dummyReports.find((r) => r.id === reportId);
    if (dummy) {
      local.push(updater({ ...dummy }));
      saveLocalReports(local);
    }
  }
}

/** Find a single report by ID from merged data */
export function getReportById(id: string): HazardReport | undefined {
  const all = getAllReports();
  return all.find((r) => r.id === id);
}

/** Generate next report number */
export function generateReportNumber(): string {
  const all = getAllReports();
  const year = new Date().getFullYear();
  const num = all.length + 1;
  return `VSL-${year}-${String(num).padStart(4, "0")}`;
}

/** Generate next report ID */
export function generateReportId(): string {
  const all = getAllReports();
  const num = all.length + 1;
  return `RPT-${String(num).padStart(3, "0")}`;
}
