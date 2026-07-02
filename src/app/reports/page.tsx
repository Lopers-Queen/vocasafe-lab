"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileWarning, Plus } from "lucide-react";
import AppShell from "@/components/AppShell";
import { getAllReports } from "@/lib/report-storage";
import type { HazardReport, RiskLevel, ReportStatus } from "@/types";

const riskColors: Record<RiskLevel, string> = {
  rendah: "bg-green-100 text-green-800",
  sedang: "bg-yellow-100 text-yellow-800",
  tinggi: "bg-orange-100 text-orange-800",
  kritis: "bg-red-100 text-red-800",
};

const statusLabels: Record<ReportStatus, string> = {
  dilaporkan: "Dilaporkan",
  diverifikasi: "Diverifikasi",
  ditindaklanjuti: "Dalam Penanganan",
  selesai: "Selesai",
  ditolak: "Ditolak",
};

const statusColors: Record<ReportStatus, string> = {
  dilaporkan: "bg-slate-100 text-slate-700",
  diverifikasi: "bg-blue-100 text-blue-700",
  ditindaklanjuti: "bg-yellow-100 text-yellow-700",
  selesai: "bg-green-100 text-green-700",
  ditolak: "bg-red-100 text-red-700",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setReports(getAllReports());
  }, []);

  if (!mounted) return <AppShell><div className="animate-pulse h-64" /></AppShell>;

  const sorted = [...reports].sort(
    (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Daftar Laporan</h1>
          <Link
            href="/reports/new"
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Laporan Baru
          </Link>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <FileWarning className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-slate-500">Belum ada laporan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((r) => (
              <Link
                key={r.id}
                href={`/reports/${r.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{r.title}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {r.reportNumber} &middot; {r.location} &middot;{" "}
                      {new Date(r.reportedAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        riskColors[r.riskResult.level]
                      }`}
                    >
                      {r.riskResult.level.charAt(0).toUpperCase() + r.riskResult.level.slice(1)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[r.status]
                      }`}
                    >
                      {statusLabels[r.status]}
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
