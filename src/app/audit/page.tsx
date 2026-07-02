"use client";

import { useEffect, useState, useRef } from "react";
import { FileText, Download, Printer } from "lucide-react";
import AppShell from "@/components/AppShell";
import { getAllReports } from "@/lib/report-storage";
import type { HazardReport, RiskLevel, ReportStatus } from "@/types";

const riskLabels: Record<RiskLevel, string> = {
  rendah: "Rendah",
  sedang: "Sedang",
  tinggi: "Tinggi",
  kritis: "Kritis",
};

const statusLabels: Record<ReportStatus, string> = {
  dilaporkan: "Dilaporkan",
  diverifikasi: "Diverifikasi",
  ditindaklanjuti: "Dalam Penanganan",
  selesai: "Selesai",
  ditolak: "Ditolak",
};

function exportCsv(reports: HazardReport[]) {
  const headers = [
    "No",
    "Nomor Laporan",
    "Judul",
    "Lokasi",
    "Status",
    "Skor Risiko",
    "Level Risiko",
    "Tanggal Lapor",
  ];
  const rows = reports.map((r, i) => [
    i + 1,
    r.reportNumber,
    `"${r.title.replace(/"/g, '""')}"`,
    `"${r.location.replace(/"/g, '""')}"`,
    statusLabels[r.status],
    r.riskResult.score,
    riskLabels[r.riskResult.level],
    new Date(r.reportedAt).toLocaleDateString("id-ID"),
  ]);

  const csv =
    "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-vocasafe-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditPage() {
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [mounted, setMounted] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setReports(getAllReports());
  }, []);

  if (!mounted) return <AppShell><div className="animate-pulse h-64" /></AppShell>;

  const totalReports = reports.length;

  const riskSummary: Record<RiskLevel, number> = {
    rendah: 0,
    sedang: 0,
    tinggi: 0,
    kritis: 0,
  };
  for (const r of reports) {
    riskSummary[r.riskResult.level]++;
  }

  const statusSummary: Record<ReportStatus, number> = {
    dilaporkan: 0,
    diverifikasi: 0,
    ditindaklanjuti: 0,
    selesai: 0,
    ditolak: 0,
  };
  for (const r of reports) {
    statusSummary[r.status]++;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Audit Report</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportCsv(reports)}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Printer className="h-4 w-4" /> Print / PDF
            </button>
          </div>
        </div>

        <div ref={printRef} className="space-y-6 print:space-y-4">
          {/* Summary */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Ringkasan Audit
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Total Laporan: <span className="font-bold">{totalReports}</span>
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">
                  Berdasarkan Risiko
                </h3>
                <div className="space-y-1">
                  {(Object.entries(riskSummary) as [RiskLevel, number][]).map(
                    ([level, count]) => (
                      <div
                        key={level}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-600">
                          {riskLabels[level]}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">
                  Berdasarkan Status
                </h3>
                <div className="space-y-1">
                  {(
                    Object.entries(statusSummary) as [ReportStatus, number][]
                  ).map(([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-600">
                        {statusLabels[status]}
                      </span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Report table */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    No
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Laporan
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Lokasi
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Risiko
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-700">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{r.title}</p>
                      <p className="text-xs text-slate-400">{r.reportNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.location}</td>
                    <td className="px-4 py-3">
                      <span className="text-slate-600">
                        {riskLabels[r.riskResult.level]} ({r.riskResult.score})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {statusLabels[r.status]}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(r.reportedAt).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
