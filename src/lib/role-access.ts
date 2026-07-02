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
  "/dashboard": ["admin_lab", "auditor", "teknisi"],
  "/scan": ["admin_lab", "auditor", "teknisi"],
  "/assets": ["admin_lab", "auditor", "teknisi"],
  "/reports": ["admin_lab", "auditor", "teknisi"],
  "/reports/new": ["admin_lab", "auditor", "teknisi"],
  "/checklists": ["admin_lab", "auditor", "teknisi"],
  "/checklists/new": ["admin_lab", "auditor", "teknisi"],
  "/audit": ["admin_lab", "auditor", "teknisi"],
};

export function canAccessRoute(role: UserRole, route: string): boolean {
  // Dynamic routes: normalize /assets/[id] to /assets, /reports/[id] to /reports
  const normalized = route.replace(/\/[A-Z]{3}-\d+.*$/, "") as RouteKey;
  const allowed = ACCESS_MATRIX[normalized];
  if (!allowed) return true; // routes not in matrix are open
  return allowed.includes(role);
}

/** Only teknisi and admin_lab can update report status / add follow-up */
export function canEditReportStatus(role: UserRole): boolean {
  return role === "teknisi" || role === "admin_lab";
}
