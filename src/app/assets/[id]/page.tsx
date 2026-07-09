"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Loader2,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import AppShell from "@/components/AppShell";
import {
  fetchAssetByLookup,
  getAssetQrPayload,
  type DatabaseAsset,
  type DatabaseAssetKind,
  type DatabaseAssetStatus,
} from "@/lib/assets";

const statusColors: Record<DatabaseAssetStatus, string> = {
  layak: "bg-green-100 text-green-800",
  perlu_dicek: "bg-amber-100 text-amber-800",
  tidak_layak: "bg-red-100 text-red-800",
};

const statusLabels: Record<DatabaseAssetStatus, string> = {
  layak: "Layak",
  perlu_dicek: "Perlu Dicek",
  tidak_layak: "Tidak Layak",
};

const kindLabels: Record<DatabaseAssetKind, string> = {
  alat: "Alat",
  fasilitas: "Fasilitas",
};

function formatDate(value: string | null): string {
  if (!value) return "Belum tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tanggal tidak valid";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(date);
}

export default function AssetDetailPage() {
  const params = useParams<{ id: string | string[] }>();
  const routeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [asset, setAsset] = useState<DatabaseAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [loadedRouteId, setLoadedRouteId] = useState<string | null>(null);
  const currentRouteId = routeId ?? "";

  function retryLoadAsset() {
    setLoading(true);
    setError("");
    setNotFound(false);
    void fetchAssetByLookup(currentRouteId).then((result) => {
      setAsset(result.asset);
      setError(result.error ?? "");
      setNotFound(!result.asset && !result.error);
      setLoadedRouteId(currentRouteId);
      setLoading(false);
    });
  }

  useEffect(() => {
    let active = true;

    void fetchAssetByLookup(currentRouteId).then((result) => {
      if (!active) return;
      setAsset(result.asset);
      setError(result.error ?? "");
      setNotFound(!result.asset && !result.error);
      setLoadedRouteId(currentRouteId);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [currentRouteId]);

  if (loading || loadedRouteId !== currentRouteId) {
    return (
      <AppShell>
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <div className="text-center text-sm text-slate-500">
            <Loader2 className="mx-auto mb-2 h-7 w-7 animate-spin text-emerald-600" />
            Memuat detail aset...
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div role="alert" className="mx-auto max-w-xl rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
          <AlertTriangle className="h-8 w-8" />
          <h1 className="mt-3 text-lg font-semibold">Detail aset tidak dapat dimuat.</h1>
          <p className="mt-1 text-sm">{error}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={retryLoadAsset}
              className="inline-flex items-center gap-2 rounded-md bg-red-100 px-3 py-2 text-sm font-medium hover:bg-red-200"
            >
              <RefreshCw className="h-4 w-4" /> Coba Lagi
            </button>
            <Link
              href="/assets"
              className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium hover:bg-red-100"
            >
              Kembali ke Daftar Aset
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (notFound || !asset) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-3 text-xl font-bold text-slate-900">Aset tidak ditemukan</h1>
          <p className="mt-2 text-sm text-slate-500">
            Kode atau ID aset tidak tersedia di Supabase.
          </p>
          <Link
            href="/assets"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Aset
          </Link>
        </div>
      </AppShell>
    );
  }

  const qrPayload = getAssetQrPayload(asset);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/assets"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900">{asset.name}</h1>
              <p className="mt-1 text-slate-500">
                {asset.code} &middot; {asset.location || "Lokasi belum ditentukan"}
              </p>
              <span
                className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[asset.status]}`}
              >
                {statusLabels[asset.status]}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2 rounded-lg bg-slate-50 p-3">
              <QRCodeSVG value={qrPayload} size={120} />
              <p className="max-w-40 break-all text-center text-xs text-slate-400">
                {qrPayload}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-700">Jenis</dt>
              <dd className="mt-1 text-slate-600">{kindLabels[asset.kind]}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-700">Kategori</dt>
              <dd className="mt-1 text-slate-600">{asset.category || "Belum tersedia"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-700">Laboratorium</dt>
              <dd className="mt-1 text-slate-600">
                {asset.laboratory
                  ? `${asset.laboratory.name} (${asset.laboratory.code})`
                  : "Belum terhubung"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-700">Lokasi</dt>
              <dd className="mt-1 text-slate-600">{asset.location || "Belum tersedia"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-medium text-slate-700">Deskripsi</dt>
              <dd className="mt-1 text-slate-600">{asset.description || "Belum tersedia"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-700">Inspeksi Terakhir</dt>
              <dd className="mt-1 text-slate-600">{formatDate(asset.lastInspectionAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-700">Inspeksi Berikutnya</dt>
              <dd className="mt-1 text-slate-600">{formatDate(asset.nextInspectionAt)}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={`/reports/new?assetId=${encodeURIComponent(asset.code)}`}
              className="inline-flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              <AlertTriangle className="h-4 w-4" /> Laporkan Bahaya
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">SOP Digital</h2>
          </div>

          {asset.sop ? (
            <>
              <h3 className="font-semibold text-slate-900">{asset.sop.title}</h3>
              <p className="mt-1 text-sm text-slate-500">
                Versi {asset.sop.version || "-"} &middot; Terakhir diperbarui{" "}
                {formatDate(asset.sop.lastUpdatedAt)}
              </p>

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-700">APD yang diperlukan</p>
                {asset.sop.requiredPpe.length > 0 ? (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
                    {asset.sop.requiredPpe.map((ppe) => (
                      <li key={ppe}>{ppe}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Tidak ada APD yang dicantumkan.</p>
                )}
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-700">Langkah-langkah</p>
                {asset.sop.steps.length > 0 ? (
                  <ol className="mt-2 list-inside list-decimal space-y-2 text-sm text-slate-600">
                    {asset.sop.steps.map((step, index) => (
                      <li key={`${index}-${step}`}>{step}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Langkah SOP belum tersedia.</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Aset ini belum terhubung dengan SOP.</p>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <QrCode className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">QR Code Aset</h2>
          </div>
          <div className="flex flex-col items-center gap-3">
            <QRCodeSVG value={qrPayload} size={200} />
            <p className="max-w-full break-all text-center text-sm text-slate-500">
              {qrPayload}
            </p>
            <p className="text-center text-xs text-slate-400">
              QR Code ini membuka identitas aset berdasarkan data Supabase.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
