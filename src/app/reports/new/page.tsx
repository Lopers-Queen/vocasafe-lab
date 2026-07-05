"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileImage,
  Loader2,
  Send,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { fetchAssets, type DatabaseAsset } from "@/lib/assets";
import {
  createReport,
  uploadReportEvidence,
  validateEvidenceFile,
} from "@/lib/reports";
import { calculateRiskScore } from "@/lib/risk-scoring";
import { getReportEvidenceBucket } from "@/lib/storage";

function NewReportFallback() {
  return (
    <AppShell>
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
        <span className="text-sm text-slate-500">Memuat form laporan...</span>
      </div>
    </AppShell>
  );
}

export default function NewReportPageWrapper() {
  return (
    <Suspense fallback={<NewReportFallback />}>
      <NewReportPage />
    </Suspense>
  );
}

function NewReportPage() {
  const searchParams = useSearchParams();
  const presetAsset = searchParams.get("assetId")?.trim() ?? "";
  const [assets, setAssets] = useState<DatabaseAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetError, setAssetError] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState(3);
  const [probability, setProbability] = useState(3);
  const [exposure, setExposure] = useState(3);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdReportId, setCreatedReportId] = useState("");
  const [attachmentWarning, setAttachmentWarning] = useState("");

  useEffect(() => {
    let active = true;

    void fetchAssets().then((result) => {
      if (!active) return;

      setAssets(result.assets);
      setAssetsLoading(false);

      if (result.error) {
        setAssetError(`Data aset tidak dapat dimuat: ${result.error}`);
        return;
      }

      if (!presetAsset) return;

      const matched = result.assets.find(
        (asset) =>
          asset.id === presetAsset ||
          asset.code.toLowerCase() === presetAsset.toLowerCase(),
      );

      if (!matched) {
        setAssetError(
          `Aset ${presetAsset} tidak ditemukan. Pilih aset lain secara manual.`,
        );
        return;
      }

      setSelectedAssetId(matched.id);
      setLocation(matched.location ?? matched.laboratory?.location ?? "");
    });

    return () => {
      active = false;
    };
  }, [presetAsset]);

  const selectedAsset =
    assets.find((asset) => asset.id === selectedAssetId) ?? null;
  const previewRisk = calculateRiskScore({ severity, probability, exposure });

  function handleAssetChange(assetId: string) {
    setSelectedAssetId(assetId);
    setError("");
    const asset = assets.find((item) => item.id === assetId);
    setLocation(asset?.location ?? asset?.laboratory?.location ?? "");
  }

  function handleEvidenceChange(file: File | null, input: HTMLInputElement) {
    setError("");

    if (!file) {
      setEvidenceFile(null);
      return;
    }

    const validationError = validateEvidenceFile(file);
    if (validationError) {
      setEvidenceFile(null);
      setError(validationError);
      input.value = "";
      return;
    }

    setEvidenceFile(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setAttachmentWarning("");

    if (!selectedAsset) {
      setError("Pilih aset terkait terlebih dahulu.");
      return;
    }

    if (!title.trim() || !description.trim() || !location.trim()) {
      setError("Judul, deskripsi, dan lokasi wajib diisi.");
      return;
    }

    setSubmitting(true);

    let storageBucket: string | null = null;
    if (evidenceFile) {
      const bucketResult = await getReportEvidenceBucket();
      if (bucketResult.error || !bucketResult.bucket) {
        setError(
          bucketResult.error ??
            "Bucket foto bukti belum dikonfigurasi. Hubungi administrator.",
        );
        setSubmitting(false);
        return;
      }
      storageBucket = bucketResult.bucket;
    }

    const result = await createReport({
      assetId: selectedAsset.id,
      laboratoryId: selectedAsset.laboratoryId,
      title,
      description,
      location,
      riskInput: { severity, probability, exposure },
    });

    if (result.error || !result.report || !result.reporterId) {
      setError(`Laporan gagal disimpan ke Supabase: ${result.error ?? "Unknown error"}`);
      setSubmitting(false);
      return;
    }

    if (evidenceFile && storageBucket) {
      const uploadResult = await uploadReportEvidence({
        reportId: result.report.id,
        reporterId: result.reporterId,
        bucket: storageBucket,
        file: evidenceFile,
      });
      setAttachmentWarning(uploadResult.error ?? "");
    }

    setCreatedReportId(result.report.id);
    setSubmitting(false);
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setSeverity(3);
    setProbability(3);
    setExposure(3);
    setEvidenceFile(null);
    setError("");
    setAttachmentWarning("");
    setCreatedReportId("");
  }

  if (createdReportId) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl space-y-6">
          <section className="rounded-lg border border-emerald-200 bg-white p-6 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="mt-4 text-2xl font-bold text-slate-900">
              Laporan Berhasil Disimpan
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Laporan {selectedAsset?.name} telah disimpan ke Supabase dengan
              skor risiko {previewRisk.score} ({previewRisk.category}).
            </p>

            {attachmentWarning && (
              <p
                role="alert"
                className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-800"
              >
                {attachmentWarning}
              </p>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Link
                href={`/reports/${createdReportId}`}
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Lihat Detail
              </Link>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Buat Laporan Baru
              </button>
              <Link
                href="/reports"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Daftar Laporan
              </Link>
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Bahaya Baru</h1>
          <p className="mt-1 text-sm text-slate-500">
            Laporkan kondisi tidak aman dan simpan bukti langsung ke Supabase.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <label
                htmlFor="report-asset"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Aset Terkait *
              </label>
              <select
                id="report-asset"
                value={selectedAssetId}
                onChange={(event) => handleAssetChange(event.target.value)}
                disabled={assetsLoading}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100"
              >
                <option value="">
                  {assetsLoading ? "Memuat aset..." : "Pilih aset..."}
                </option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.code})
                  </option>
                ))}
              </select>
            </div>

            {assetError && (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {assetError}
              </p>
            )}

            {selectedAsset && (
              <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4 text-sm">
                <p className="font-semibold text-emerald-900">{selectedAsset.name}</p>
                <p className="mt-1 text-emerald-800">
                  {selectedAsset.code} &middot; {selectedAsset.location ?? "Tanpa lokasi"}
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  Status: {selectedAsset.status.replaceAll("_", " ")}
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="report-title"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Judul Laporan *
              </label>
              <input
                id="report-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Contoh: Kabel mesin bor terkelupas"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="report-description"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Deskripsi *
              </label>
              <textarea
                id="report-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Jelaskan detail bahaya yang ditemukan..."
                required
                className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="report-location"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Lokasi *
              </label>
              <input
                id="report-location"
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </section>

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">Penilaian Risiko</h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="severity" className="mb-1 block text-sm font-medium text-slate-700">
                  Severity (1-5): {severity}
                </label>
                <input
                  id="severity"
                  type="range"
                  min={1}
                  max={5}
                  value={severity}
                  onChange={(event) => setSeverity(Number(event.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
              <div>
                <label htmlFor="probability" className="mb-1 block text-sm font-medium text-slate-700">
                  Probability (1-5): {probability}
                </label>
                <input
                  id="probability"
                  type="range"
                  min={1}
                  max={5}
                  value={probability}
                  onChange={(event) => setProbability(Number(event.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
              <div>
                <label htmlFor="exposure" className="mb-1 block text-sm font-medium text-slate-700">
                  Exposure (1-5): {exposure}
                </label>
                <input
                  id="exposure"
                  type="range"
                  min={1}
                  max={5}
                  value={exposure}
                  onChange={(event) => setExposure(Number(event.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>

            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                Skor Risiko: <strong>{previewRisk.score}</strong>{" "}
                <span
                  className={`ml-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    previewRisk.category === "rendah"
                      ? "bg-green-100 text-green-800"
                      : previewRisk.category === "sedang"
                        ? "bg-yellow-100 text-yellow-800"
                        : previewRisk.category === "tinggi"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-red-100 text-red-800"
                  }`}
                >
                  {previewRisk.category.charAt(0).toUpperCase() +
                    previewRisk.category.slice(1)}
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {previewRisk.recommendation}
              </p>
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <FileImage className="h-5 w-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Foto Bukti</h2>
            </div>
            <p className="text-xs text-slate-500">
              Opsional. Satu file JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.
            </p>
            <input
              id="report-evidence"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                handleEvidenceChange(event.target.files?.[0] ?? null, event.currentTarget)
              }
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {evidenceFile && (
              <p className="break-all rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                File dipilih: {evidenceFile.name} ({(evidenceFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </section>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || assetsLoading}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Kirim Laporan
              </>
            )}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
