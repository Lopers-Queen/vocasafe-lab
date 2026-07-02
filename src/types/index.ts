export type UserRole = "admin_lab" | "auditor" | "teknisi";

export type AssetKind = "alat" | "fasilitas";

export type AssetStatus =
  | "aman"
  | "perlu_pemeriksaan"
  | "tidak_layak_pakai";

export type ReportStatus =
  | "dilaporkan"
  | "diverifikasi"
  | "ditindaklanjuti"
  | "selesai"
  | "ditolak";

export type RiskLevel = "rendah" | "sedang" | "tinggi" | "kritis";

export type ControlCondition = "efektif" | "sebagian" | "tidak_ada";

export type ChecklistAnswer = "ya" | "tidak" | "tidak_berlaku";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface StandardOperatingProcedure {
  id: string;
  title: string;
  version: string;
  lastUpdated: string;
  steps: string[];
  requiredPpe: string[];
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  kind: AssetKind;
  category: string;
  location: string;
  description: string;
  status: AssetStatus;
  lastInspectionAt: string;
  nextInspectionAt: string;
  qrValue: string;
  sopId: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  isCritical: boolean;
  guidance?: string;
}

export interface ChecklistResponse {
  itemId: string;
  answer: ChecklistAnswer;
  note?: string;
}

export interface SafetyChecklist {
  id: string;
  title: string;
  assetKind: AssetKind;
  items: ChecklistItem[];
}

export interface EvidencePhoto {
  id: string;
  fileName: string;
  imageUrl: string;
  uploadedAt: string;
}

export interface ReportStatusHistory {
  status: ReportStatus;
  changedAt: string;
  changedByUserId: string;
  note?: string;
}

export interface RiskScoringInput {
  severity: number;
  likelihood: number;
  controlCondition: ControlCondition;
  isRecurring: boolean;
}

export interface RiskScoringResult {
  baseScore: number;
  modifier: number;
  score: number;
  level: RiskLevel;
  recommendation: string;
}

export interface HazardReport {
  id: string;
  reportNumber: string;
  assetId: string;
  reporterUserId: string;
  title: string;
  description: string;
  location: string;
  reportedAt: string;
  status: ReportStatus;
  riskInput: RiskScoringInput;
  riskResult: RiskScoringResult;
  evidencePhotos: EvidencePhoto[];
  statusHistory: ReportStatusHistory[];
}
