"use client";

import { fetchAssets, type DatabaseAsset, type DatabaseAssetStatus } from "@/lib/assets";
import {
  fetchChecklistResults,
  type DatabaseChecklistResult,
} from "@/lib/checklists";
import { fetchReports, type DatabaseReport } from "@/lib/reports";
import type { ReportStatus, RiskLevel } from "@/types";

export interface SupabaseSummary {
  assets: DatabaseAsset[];
  reports: DatabaseReport[];
  checklistResults: DatabaseChecklistResult[];
  assetStatus: Record<DatabaseAssetStatus, number>;
  reportStatus: Record<ReportStatus, number>;
  reportRisk: Record<RiskLevel, number>;
  checklistRisk: Record<RiskLevel, number>;
  checklistWithoutRisk: number;
  checklistHighOrCritical: number;
  openReports: number;
  latestReports: DatabaseReport[];
  latestChecklistResults: DatabaseChecklistResult[];
}

export interface SupabaseSummaryResult {
  summary: SupabaseSummary;
  errors: string[];
}

function emptyAssetStatus(): Record<DatabaseAssetStatus, number> {
  return { layak: 0, perlu_dicek: 0, tidak_layak: 0 };
}

function emptyReportStatus(): Record<ReportStatus, number> {
  return {
    baru: 0,
    diverifikasi: 0,
    dalam_penanganan: 0,
    selesai: 0,
    ditolak: 0,
  };
}

function emptyRiskSummary(): Record<RiskLevel, number> {
  return { rendah: 0, sedang: 0, tinggi: 0, kritis: 0 };
}

export async function fetchSupabaseSummary(): Promise<SupabaseSummaryResult> {
  const [assetResult, reportResult, checklistResult] = await Promise.all([
    fetchAssets(),
    fetchReports(),
    fetchChecklistResults(),
  ]);

  const errors = [
    assetResult.error ? `Aset: ${assetResult.error}` : null,
    reportResult.error ? `Laporan: ${reportResult.error}` : null,
    checklistResult.error ? `Checklist: ${checklistResult.error}` : null,
  ].filter((error): error is string => Boolean(error));

  const assetStatus = emptyAssetStatus();
  for (const asset of assetResult.assets) assetStatus[asset.status] += 1;

  const reportStatus = emptyReportStatus();
  const reportRisk = emptyRiskSummary();
  for (const report of reportResult.reports) {
    reportStatus[report.status] += 1;
    reportRisk[report.riskCategory] += 1;
  }

  const checklistRisk = emptyRiskSummary();
  let checklistWithoutRisk = 0;
  for (const checklist of checklistResult.results) {
    if (checklist.riskCategory) {
      checklistRisk[checklist.riskCategory] += 1;
    } else {
      checklistWithoutRisk += 1;
    }
  }

  return {
    summary: {
      assets: assetResult.assets,
      reports: reportResult.reports,
      checklistResults: checklistResult.results,
      assetStatus,
      reportStatus,
      reportRisk,
      checklistRisk,
      checklistWithoutRisk,
      checklistHighOrCritical:
        checklistRisk.tinggi + checklistRisk.kritis,
      openReports:
        reportStatus.baru +
        reportStatus.diverifikasi +
        reportStatus.dalam_penanganan,
      latestReports: reportResult.reports.slice(0, 5),
      latestChecklistResults: checklistResult.results.slice(0, 5),
    },
    errors,
  };
}
