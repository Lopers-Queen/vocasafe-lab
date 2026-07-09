"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  FileWarning,
  Loader2,
  Package,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import {
  fetchSupabaseSummary,
  type SupabaseSummary,
} from "@/lib/summary";
import type { ReportStatus, RiskLevel } from "@/types";

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

const statusLabels: Record<ReportStatus, string> = {
  baru: "Baru",
  diverifikasi: "Diverifikasi",
  dalam_penanganan: "Dalam Penanganan",
  selesai: "Selesai",
  ditolak: "Ditolak",
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<SupabaseSummary | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void fetchSupabaseSummary().then((result) => {
      if (!active) return;
      setSummary(result.summary);
      setErrors(result.errors);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  if (loading || !summary) {
    return (
      <AppShell>
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
          <span className="text-sm text-slate-500">Memuat dashboard...</span>
        </div>
      </AppShell>
    );
  }

  const stats = [
    {
      label: "Total Aset",
      value: summary.assets.length,
      icon: Package,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Total Laporan",
      value: summary.reports.length,
      icon: FileWarning,
      color: "bg-sky-100 text-sky-600",
    },
    {
      label: "Total Checklist",
      value: summary.checklistResults.length,
      icon: ClipboardCheck,
      color: "bg-teal-100 text-teal-600",
    },
    {
      label: "Temuan Tinggi/Kritis",
      value:
        summary.reportRisk.tinggi +
        summary.reportRisk.kritis +
        summary.checklistHighOrCritical,
      icon: AlertTriangle,
      color: "bg-red-100 text-red-600",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ringkasan kondisi K3 berdasarkan data Supabase terbaru.
          </p>
        </div>

        {errors.length > 0 && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Sebagian data tidak dapat dimuat.</p>
              <ul className="mt-1 list-disc pl-5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-slate-900">Status Aset</h2>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-green-50 p-3 text-green-800">
                <p className="text-2xl font-bold">{summary.assetStatus.layak}</p>
                <p className="text-xs font-medium">Layak</p>
              </div>
              <div className="rounded-md bg-yellow-50 p-3 text-yellow-800">
                <p className="text-2xl font-bold">
                  {summary.assetStatus.perlu_dicek}
                </p>
                <p className="text-xs font-medium">Perlu Dicek</p>
              </div>
              <div className="rounded-md bg-red-50 p-3 text-red-800">
                <p className="text-2xl font-bold">
                  {summary.assetStatus.tidak_layak}
                </p>
                <p className="text-xs font-medium">Tidak Layak</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-600" />
              <h2 className="font-semibold text-slate-900">Risiko Laporan</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.entries(summary.reportRisk) as [RiskLevel, number][]).map(
                ([risk, count]) => (
                  <div
                    key={risk}
                    className={`rounded-md p-3 text-center ${riskColors[risk]}`}
                  >
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs font-medium">{riskLabels[risk]}</p>
                  </div>
                ),
              )}
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-900">Status Laporan</h2>
            <p className="text-xs text-slate-500">
              Belum selesai: {summary.openReports}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(Object.entries(summary.reportStatus) as [ReportStatus, number][]).map(
              ([status, count]) => (
                <div key={status} className="rounded-md bg-slate-50 p-3 text-center">
                  <p className="text-xl font-bold text-slate-800">{count}</p>
                  <p className="text-xs text-slate-500">{statusLabels[status]}</p>
                </div>
              ),
            )}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">Laporan Terbaru</h2>
            {summary.latestReports.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada laporan.</p>
            ) : (
              <div className="space-y-2">
                {summary.latestReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/reports/${report.id}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-slate-100 p-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {report.title}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {report.asset?.code ?? "Tanpa aset"} &middot; {report.location}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${riskColors[report.riskCategory]}`}
                    >
                      {riskLabels[report.riskCategory]}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">
              Checklist Terbaru
            </h2>
            {summary.latestChecklistResults.length === 0 ? (
              <p className="text-sm text-slate-500">
                Belum ada hasil checklist atau akses dibatasi RLS.
              </p>
            ) : (
              <div className="space-y-2">
                {summary.latestChecklistResults.map((checklist) => (
                  <div
                    key={checklist.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-slate-100 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {checklist.template?.title ?? "Checklist K3"}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {checklist.asset?.code ?? "Tanpa aset"} &middot;{" "}
                        {new Date(checklist.completedAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-600">
                      {checklist.riskCategory
                        ? `${riskLabels[checklist.riskCategory]} (${checklist.riskScore})`
                        : "Tanpa temuan"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <p className="text-xs text-slate-400">
          Ringkasan checklist mengikuti policy RLS untuk role yang sedang login.
        </p>
      </div>
    </AppShell>
  );
}
