import type { UserRole } from "../types";

type RouteKey =
  | "/dashboard"
  | "/scan"
  | "/assets"
  | "/reports"
  | "/reports/new"
  | "/checklists"
  | "/checklists/new"
  | "/audit";

const ACCESS_MATRIX: Record<RouteKey, UserRole[]> = {
  "/dashboard": ["mahasiswa", "dosen", "teknisi", "kepala_lab", "admin"],
  "/scan": ["mahasiswa", "dosen", "teknisi", "admin"],
  "/assets": ["mahasiswa", "dosen", "teknisi", "kepala_lab", "admin"],
  "/reports": ["mahasiswa", "dosen", "teknisi", "kepala_lab", "admin"],
  "/reports/new": ["mahasiswa", "dosen", "teknisi", "admin"],
  "/checklists": ["dosen", "teknisi", "admin"],
  "/checklists/new": ["dosen", "teknisi", "admin"],
  "/audit": ["teknisi", "kepala_lab", "admin"],
};

export function canAccessRoute(role: UserRole, route: string): boolean {
  // Dynamic routes: normalize /assets/[id] to /assets, /reports/[id] to /reports
  const normalized = route.replace(/\/[A-Z]{3}-\d+.*$/, "") as RouteKey;
  const allowed = ACCESS_MATRIX[normalized];
  if (!allowed) return true; // routes not in matrix are open
  return allowed.includes(role);
}

/** Only teknisi and admin can update report status / add follow-up */
export function canEditReportStatus(role: UserRole): boolean {
  return role === "teknisi" || role === "admin";
}
