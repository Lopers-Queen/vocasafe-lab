"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { dummyAssets } from "@/data/dummy-data";
import { getCurrentUser } from "@/lib/auth";
import { calculateRiskScore } from "@/lib/risk-scoring";
import {
  addLocalReport,
  generateReportId,
  generateReportNumber,
} from "@/lib/report-storage";
import type { ControlCondition, HazardReport } from "@/types";

export default function NewReportPageWrapper() {
  return (
    <Suspense fallback={<AppShell><div className="animate-pulse h-64" /></AppShell>}>
      <NewReportPage />
    </Suspense>
  );
}

function NewReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetAssetId = searchParams.get("assetId") ?? "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assetId, setAssetId] = useState(presetAssetId);
  const [location, setLocation] = useState(
    () => dummyAssets.find((a) => a.id === presetAssetId)?.location ?? ""
  );
  const [severity, setSeverity] = useState(3);
  const [likelihood, setLikelihood] = useState(3);
  const [controlCondition, setControlCondition] =
    useState<ControlCondition>("sebagian");
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState("");

  function handleAssetChange(newAssetId: string) {
    setAssetId(newAssetId);
    const asset = dummyAssets.find((a) => a.id === newAssetId);
    if (asset) setLocation(asset.location);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const user = getCurrentUser();
    if (!user) {
      setError("Silakan login terlebih dahulu.");
      return;
    }

    if (!title.trim() || !description.trim() || !assetId) {
      setError("Harap lengkapi semua field wajib.");
      return;
    }

    const riskInput = { severity, likelihood, controlCondition, isRecurring };
    const riskResult = calculateRiskScore(riskInput);

    const report: HazardReport = {
      id: generateReportId(),
      reportNumber: generateReportNumber(),
      assetId,
      reporterUserId: user.id,
      title: title.trim(),
      description: description.trim(),
      location,
      reportedAt: new Date().toISOString(),
      status: "dilaporkan",
      riskInput,
      riskResult,
      evidencePhotos: [],
      statusHistory: [
        {
          status: "dilaporkan",
          changedAt: new Date().toISOString(),
          changedByUserId: user.id,
        },
      ],
    };

    addLocalReport(report);
    router.push("/reports");
  }

  const previewRisk = calculateRiskScore({
    severity,
    likelihood,
    controlCondition,
    isRecurring,
  });

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <h1 className="text-2xl font-bold text-slate-900">Laporan Bahaya Baru</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Aset Terkait *
              </label>
              <select
                value={assetId}
                onChange={(e) => handleAssetChange(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="">Pilih aset...</option>
                {dummyAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Judul Laporan *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Deskripsi singkat bahaya"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Deskripsi *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Jelaskan detail bahaya yang ditemukan..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Lokasi
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Risk scoring */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Penilaian Risiko</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Severity (1-5): {severity}
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Likelihood (1-5): {likelihood}
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={likelihood}
                  onChange={(e) => setLikelihood(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kondisi Kontrol
              </label>
              <select
                value={controlCondition}
                onChange={(e) =>
                  setControlCondition(e.target.value as ControlCondition)
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="efektif">Efektif</option>
                <option value="sebagian">Sebagian</option>
                <option value="tidak_ada">Tidak Ada</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded accent-emerald-600"
              />
              Kejadian berulang
            </label>

            {/* Preview */}
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-sm text-slate-600">
                Skor Risiko:{" "}
                <span className="font-bold">{previewRisk.score}</span>{" "}
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    previewRisk.level === "rendah"
                      ? "bg-green-100 text-green-800"
                      : previewRisk.level === "sedang"
                      ? "bg-yellow-100 text-yellow-800"
                      : previewRisk.level === "tinggi"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {previewRisk.level.charAt(0).toUpperCase() +
                    previewRisk.level.slice(1)}
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {previewRisk.recommendation}
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-md p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <Send className="h-4 w-4" /> Kirim Laporan
          </button>
        </form>
      </div>
    </AppShell>
  );
}
