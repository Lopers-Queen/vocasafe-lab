"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, QrCode, FileText, AlertTriangle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import AppShell from "@/components/AppShell";
import { dummyAssets, dummySops } from "@/data/dummy-data";

const statusColors: Record<string, string> = {
  aman: "bg-green-100 text-green-800",
  perlu_pemeriksaan: "bg-yellow-100 text-yellow-800",
  tidak_layak_pakai: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  aman: "Aman",
  perlu_pemeriksaan: "Perlu Pemeriksaan",
  tidak_layak_pakai: "Tidak Layak Pakai",
};

export default function AssetDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const asset = dummyAssets.find((a) => a.id === id);

  if (!asset) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <p className="text-slate-500">Aset tidak ditemukan.</p>
          <Link href="/assets" className="text-emerald-600 hover:underline mt-2 inline-block">
            Kembali ke daftar aset
          </Link>
        </div>
      </AppShell>
    );
  }

  const sop = dummySops.find((s) => s.id === asset.sopId);

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        <Link
          href="/assets"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{asset.name}</h1>
              <p className="text-slate-500">{asset.code} &middot; {asset.location}</p>
              <span
                className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusColors[asset.status] ?? "bg-slate-100 text-slate-700"
                }`}
              >
                {statusLabels[asset.status] ?? asset.status}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <QRCodeSVG value={asset.qrValue} size={120} />
              <p className="text-xs text-slate-400">{asset.qrValue}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p><span className="font-medium text-slate-700">Kategori:</span> {asset.category}</p>
            <p><span className="font-medium text-slate-700">Jenis:</span> {asset.kind === "alat" ? "Alat" : "Fasilitas"}</p>
            <p><span className="font-medium text-slate-700">Deskripsi:</span> {asset.description}</p>
            <p><span className="font-medium text-slate-700">Inspeksi terakhir:</span> {new Date(asset.lastInspectionAt).toLocaleDateString("id-ID")}</p>
            <p><span className="font-medium text-slate-700">Inspeksi berikutnya:</span> {new Date(asset.nextInspectionAt).toLocaleDateString("id-ID")}</p>
          </div>

          <div className="mt-4 flex gap-2">
            <Link
              href={`/reports/new?assetId=${asset.id}`}
              className="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              <AlertTriangle className="h-4 w-4" /> Laporkan Bahaya
            </Link>
          </div>
        </div>

        {/* SOP */}
        {sop && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">{sop.title}</h2>
            </div>
            <p className="text-sm text-slate-500 mb-3">
              Versi {sop.version} &middot; Terakhir diperbarui {new Date(sop.lastUpdated).toLocaleDateString("id-ID")}
            </p>
            {sop.requiredPpe.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-slate-700 mb-1">APD yang diperlukan:</p>
                <ul className="list-disc list-inside text-sm text-slate-600">
                  {sop.requiredPpe.map((ppe, i) => (
                    <li key={i}>{ppe}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Langkah-langkah:</p>
              <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                {sop.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* QR Code section */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">QR Code Aset</h2>
          </div>
          <div className="flex flex-col items-center gap-3">
            <QRCodeSVG value={asset.qrValue} size={200} />
            <p className="text-sm text-slate-500">{asset.qrValue}</p>
            <p className="text-xs text-slate-400">
              Scan QR Code ini untuk mengakses informasi aset
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
