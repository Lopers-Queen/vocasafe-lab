"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  ExternalLink,
  ImageIcon,
  Loader2,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { fetchReportById, type DatabaseReport } from "@/lib/reports";
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

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "Ukuran tidak tersedia";
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [report, setReport] = useState<DatabaseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [attachmentError, setAttachmentError] = useState("");

  useEffect(() => {
    let active = true;

    void fetchReportById(id).then((result) => {
      if (!active) return;
      setReport(result.report);
      setNotFound(!result.report && !result.error);
      setError(
        result.error
          ? `Laporan tidak dapat dimuat dari Supabase: ${result.error}`
          : "",
      );
      setAttachmentError(
        result.attachmentError
          ? `Foto bukti tidak dapat ditampilkan: ${result.attachmentError}`
          : "",
      );
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
          <span className="text-sm text-slate-500">Memuat detail laporan...</span>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-4">
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
          <Link href="/reports" className="text-sm text-emerald-600 hover:underline">
            Kembali ke daftar laporan
          </Link>
        </div>
      </AppShell>
    );
  }

  if (notFound || !report) {
    return (
      <AppShell>
        <div className="py-12 text-center">
          <p className="text-slate-500">Laporan tidak ditemukan.</p>
          <Link
            href="/reports"
            className="mt-2 inline-block text-emerald-600 hover:underline"
          >
            Kembali ke daftar laporan
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900">{report.title}</h1>
              <p className="mt-1 break-all text-sm text-slate-500">
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
            <div className="flex flex-wrap gap-2 sm:justify-end">
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

          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-700">Lokasi</dt>
              <dd className="mt-1 text-slate-600">{report.location}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-700">Aset terkait</dt>
              <dd className="mt-1 text-slate-600">
                {report.asset ? (
                  <Link
                    href={`/assets/${encodeURIComponent(report.asset.code)}`}
                    className="text-emerald-600 hover:underline"
                  >
                    {report.asset.name} ({report.asset.code})
                  </Link>
                ) : (
                  "Tidak tersedia"
                )}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-medium text-slate-700">Deskripsi</dt>
              <dd className="mt-1 whitespace-pre-wrap text-slate-600">
                {report.description}
              </dd>
            </div>
          </dl>

          <div className="mt-5 rounded-md bg-slate-50 p-4">
            <h2 className="font-semibold text-slate-800">Ringkasan Risiko</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-600 sm:grid-cols-4">
              <p>Severity: {report.severity}</p>
              <p>Probability: {report.probability}</p>
              <p>Exposure: {report.exposure}</p>
              <p>Skor: {report.riskScore}</p>
            </div>
            <p className="mt-3 text-sm text-slate-600">{report.recommendation}</p>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Foto Bukti</h2>
          </div>

          {attachmentError && (
            <p
              role="alert"
              className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
            >
              {attachmentError}
            </p>
          )}

          {report.attachments.length === 0 ? (
            <p className="text-sm text-slate-500">Tidak ada foto bukti.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {report.attachments.map((attachment) => (
                <article
                  key={attachment.id}
                  className="overflow-hidden rounded-lg border border-slate-200"
                >
                  {attachment.signedUrl ? (
                    <a
                      href={attachment.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block bg-slate-100"
                    >
                      {/* Signed URLs are dynamic and cannot use a fixed Next Image host config. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={attachment.signedUrl}
                        alt={`Foto bukti ${attachment.fileName}`}
                        className="h-52 w-full object-cover"
                      />
                    </a>
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-slate-100 text-sm text-slate-500">
                      Preview tidak tersedia
                    </div>
                  )}
                  <div className="p-3">
                    <p className="break-all text-sm font-medium text-slate-800">
                      {attachment.fileName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatFileSize(attachment.sizeBytes)}
                    </p>
                    {attachment.signedUrl && (
                      <a
                        href={attachment.signedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
                      >
                        Buka foto <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Tindak Lanjut</h2>
          </div>
          <p className="text-sm text-slate-500">
            Perubahan status dan riwayat tindak lanjut Supabase akan dimigrasi
            pada task berikutnya.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
