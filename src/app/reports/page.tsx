"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, FileWarning, Loader2, Plus } from "lucide-react";
import AppShell from "@/components/AppShell";
import { fetchReports, type DatabaseReport } from "@/lib/reports";
import type { ReportStatus, RiskLevel } from "@/types";

const riskColors: Record<RiskLevel, string> = {
  rendah: "bg-green-100 text-green-800",
  sedang: "bg-yellow-100 text-yellow-800",
  tinggi: "bg-orange-100 text-orange-800",
  kritis: "bg-red-100 text-red-800",
};

const statusLabels: Record<ReportStatus, string> = {
  baru: "Baru",
  diverifikasi: "Diverifikasi",
  dalam_penanganan: "Dalam Penanganan",
  selesai: "Selesai",
  ditolak: "Ditolak",
};

const statusColors: Record<ReportStatus, string> = {
  baru: "bg-slate-100 text-slate-700",
  diverifikasi: "bg-teal-100 text-teal-700",
  dalam_penanganan: "bg-yellow-100 text-yellow-700",
  selesai: "bg-green-100 text-green-700",
  ditolak: "bg-red-100 text-red-700",
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function ReportsPage() {
  const [reports, setReports] = useState<DatabaseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    void fetchReports().then((result) => {
      if (!active) return;
      setReports(result.reports);
      setError(
        result.error
          ? `Laporan tidak dapat dimuat dari Supabase: ${result.error}`
          : "",
      );
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Daftar Laporan</h1>
            <p className="mt-1 text-sm text-slate-500">
              Data laporan bahaya tersimpan dan dimuat dari Supabase.
            </p>
          </div>
          <Link
            href="/reports/new"
            className="inline-flex min-h-10 items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Laporan Baru
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
            <span className="text-sm text-slate-500">Memuat laporan...</span>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <FileWarning className="mx-auto mb-2 h-10 w-10 text-slate-300" />
            <p className="text-slate-500">Belum ada laporan di Supabase.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{report.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {report.asset
                        ? `${report.asset.name} (${report.asset.code})`
                        : "Tanpa aset"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {report.location} &middot;{" "}
                      {new Date(report.reportedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${riskColors[report.riskCategory]}`}
                    >
                      {capitalize(report.riskCategory)} &middot; {report.riskScore}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[report.status]}`}
                    >
                      {statusLabels[report.status]}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
