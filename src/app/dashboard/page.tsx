"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileWarning,
  AlertTriangle,
  Clock,
  BarChart3,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { getAllReports } from "@/lib/report-storage";
import type { HazardReport, RiskLevel } from "@/types";

const riskColors: Record<RiskLevel, string> = {
  rendah: "bg-green-100 text-green-800",
  sedang: "bg-yellow-100 text-yellow-800",
  tinggi: "bg-orange-100 text-orange-800",
  kritis: "bg-red-100 text-red-800",
};

const riskLabels: Record<RiskLevel, string> = {
  rendah: "Rendah",
  sedang: "Sedang",
  tinggi: "Tinggi",
  kritis: "Kritis",
};

export default function DashboardPage() {
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setReports(getAllReports());
  }, []);

  if (!mounted) return <AppShell><div className="animate-pulse h-64" /></AppShell>;

  const totalReports = reports.length;
  const criticalReports = reports.filter(
    (r) => r.riskResult.level === "kritis"
  ).length;
  const pendingReports = reports.filter(
    (r) => r.status === "dilaporkan" || r.status === "diverifikasi"
  ).length;

  // Risk level summary
  const riskSummary: Record<RiskLevel, number> = {
    rendah: 0,
    sedang: 0,
    tinggi: 0,
    kritis: 0,
  };
  for (const r of reports) {
    riskSummary[r.riskResult.level]++;
  }

  // Recent reports (last 5)
  const recentReports = [...reports]
    .sort(
      (a, b) =>
        new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    )
    .slice(0, 5);

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-2">
                <FileWarning className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Laporan</p>
                <p className="text-2xl font-bold text-slate-900">{totalReports}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Risiko Kritis</p>
                <p className="text-2xl font-bold text-slate-900">{criticalReports}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-100 p-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Belum Selesai</p>
                <p className="text-2xl font-bold text-slate-900">{pendingReports}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Risk summary */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Ringkasan Risiko</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.entries(riskSummary) as [RiskLevel, number][]).map(
              ([level, count]) => (
                <div
                  key={level}
                  className={`rounded-lg p-3 text-center ${riskColors[level]}`}
                >
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm font-medium">{riskLabels[level]}</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Recent reports */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Laporan Terbaru
          </h2>
          {recentReports.length === 0 ? (
            <p className="text-slate-500 text-sm">Belum ada laporan.</p>
          ) : (
            <div className="space-y-3">
              {recentReports.map((r) => (
                <Link
                  key={r.id}
                  href={`/reports/${r.id}`}
                  className="flex items-center justify-between rounded-md border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">
                      {r.title}
                    </p>
                    <p className="text-sm text-slate-500">
                      {r.reportNumber} &middot; {r.location}
                    </p>
                  </div>
                  <span
                    className={`ml-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      riskColors[r.riskResult.level]
                    }`}
                  >
                    {riskLabels[r.riskResult.level]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
