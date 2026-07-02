"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import AppShell from "@/components/AppShell";
import FollowUpPanel from "@/components/reports/FollowUpPanel";
import { getReportById } from "@/lib/report-storage";
import { dummyAssets, dummyUsers } from "@/data/dummy-data";
import type { HazardReport, RiskLevel, ReportStatus } from "@/types";

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
  diverifikasi: "bg-blue-100 text-blue-700",
  dalam_penanganan: "bg-yellow-100 text-yellow-700",
  selesai: "bg-green-100 text-green-700",
  ditolak: "bg-red-100 text-red-700",
};

export default function ReportDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [report, setReport] = useState<HazardReport | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const r = getReportById(id);
    setReport(r ?? null);
  }, [id]);

  if (!mounted) return <AppShell><div className="animate-pulse h-64" /></AppShell>;

  if (!report) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <p className="text-slate-500">Laporan tidak ditemukan.</p>
          <Link href="/reports" className="text-emerald-600 hover:underline mt-2 inline-block">
            Kembali ke daftar laporan
          </Link>
        </div>
      </AppShell>
    );
  }

  const asset = dummyAssets.find((a) => a.id === report.assetId);
  const reporter = dummyUsers.find((u) => u.id === report.reporterUserId);

  function handleUpdate(updated: HazardReport) {
    setReport(updated);
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        {/* Report header */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{report.title}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {report.reportNumber} &middot;{" "}
                {new Date(report.reportedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  riskColors[report.riskResult.category]
                }`}
              >
                {report.riskResult.category.charAt(0).toUpperCase() +
                  report.riskResult.category.slice(1)}{" "}
                (Skor: {report.riskResult.score})
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusColors[report.status]
                }`}
              >
                {statusLabels[report.status]}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-700">Lokasi:</span>{" "}
              {report.location}
            </p>
            {asset && (
              <p>
                <span className="font-medium text-slate-700">Aset:</span>{" "}
                <Link
                  href={`/assets/${asset.id}`}
                  className="text-emerald-600 hover:underline"
                >
                  {asset.name} ({asset.code})
                </Link>
              </p>
            )}
            {reporter && (
              <p>
                <span className="font-medium text-slate-700">Pelapor:</span>{" "}
                {reporter.name}
              </p>
            )}
            <p>
              <span className="font-medium text-slate-700">Deskripsi:</span>{" "}
              {report.description}
            </p>
          </div>

          {/* Risk detail */}
          <div className="mt-4 rounded-md bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-700 mb-1">Detail Risiko</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 sm:grid-cols-3">
              <p>Severity: {report.riskInput.severity}</p>
              <p>Probability: {report.riskInput.probability}</p>
              <p>Exposure: {report.riskInput.exposure}</p>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {report.riskResult.recommendation}
            </p>
          </div>
        </div>

        {/* Status history */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Riwayat Status</h2>
          </div>
          <div className="space-y-3">
            {report.statusHistory.map((h, i) => {
              const changer = dummyUsers.find(
                (u) => u.id === h.changedByUserId
              );
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 border-l-2 border-emerald-200 pl-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusColors[h.status]
                        }`}
                      >
                        {statusLabels[h.status]}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(h.changedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {changer && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        oleh {changer.name}
                      </p>
                    )}
                    {h.note && (
                      <p className="text-sm text-slate-600 mt-1">{h.note}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Follow-up panel */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Tindak Lanjut
          </h2>
          <FollowUpPanel report={report} onUpdate={handleUpdate} />
        </div>
      </div>
    </AppShell>
  );
}
