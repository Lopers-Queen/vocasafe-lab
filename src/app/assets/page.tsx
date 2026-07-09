"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Package, RefreshCw, Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import {
  fetchAssets,
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

export default function AssetsPage() {
  const [assets, setAssets] = useState<DatabaseAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"semua" | DatabaseAssetKind>(
    "semua",
  );
  const [statusFilter, setStatusFilter] = useState<
    "semua" | DatabaseAssetStatus
  >("semua");

  function retryLoadAssets() {
    setLoading(true);
    setError("");
    void fetchAssets().then((result) => {
      setAssets(result.assets);
      setError(result.error ?? "");
      setLoading(false);
    });
  }

  useEffect(() => {
    let active = true;

    void fetchAssets().then((result) => {
      if (!active) return;
      setAssets(result.assets);
      setError(result.error ?? "");
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");

    return assets.filter((asset) => {
      const matchesSearch =
        !query ||
        [
          asset.name,
          asset.code,
          asset.location,
          asset.category,
          asset.laboratory?.name,
        ].some((value) => value?.toLocaleLowerCase("id-ID").includes(query));
      const matchesKind = kindFilter === "semua" || asset.kind === kindFilter;
      const matchesStatus =
        statusFilter === "semua" || asset.status === statusFilter;

      return matchesSearch && matchesKind && matchesStatus;
    });
  }, [assets, kindFilter, search, statusFilter]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daftar Aset</h1>
          <p className="mt-1 text-sm text-slate-500">
            Data alat dan fasilitas laboratorium dari Supabase.
          </p>
        </div>

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_180px_200px]">
          <label className="relative block">
            <span className="sr-only">Cari aset</span>
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, kode, lokasi, atau laboratorium"
              className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </label>

          <label>
            <span className="sr-only">Filter jenis aset</span>
            <select
              value={kindFilter}
              onChange={(event) =>
                setKindFilter(event.target.value as "semua" | DatabaseAssetKind)
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="semua">Semua Jenis</option>
              <option value="alat">Alat</option>
              <option value="fasilitas">Fasilitas</option>
            </select>
          </label>

          <label>
            <span className="sr-only">Filter status aset</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "semua" | DatabaseAssetStatus,
                )
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="semua">Semua Status</option>
              <option value="layak">Layak</option>
              <option value="perlu_dicek">Perlu Dicek</option>
              <option value="tidak_layak">Tidak Layak</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
            <div className="text-center text-sm text-slate-500">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-emerald-600" />
              Memuat data aset...
            </div>
          </div>
        ) : error ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Data aset tidak dapat dimuat.</p>
                <p className="mt-1 text-sm">{error}</p>
                <button
                  type="button"
                  onClick={retryLoadAssets}
                  className="mt-3 inline-flex items-center gap-2 rounded-md bg-red-100 px-3 py-2 text-sm font-medium hover:bg-red-200"
                >
                  <RefreshCw className="h-4 w-4" /> Coba Lagi
                </button>
              </div>
            </div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <Package className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">
              {assets.length === 0
                ? "Belum ada data aset di Supabase."
                : "Tidak ada aset yang sesuai pencarian atau filter."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500">
              Menampilkan {filteredAssets.length} dari {assets.length} aset.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredAssets.map((asset) => (
                <Link
                  key={asset.id}
                  href={`/assets/${encodeURIComponent(asset.code)}`}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-emerald-100 p-2">
                      <Package className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{asset.name}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {asset.code} &middot; {kindLabels[asset.kind]}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {asset.location || "Lokasi belum ditentukan"}
                      </p>
                      {asset.laboratory && (
                        <p className="mt-1 text-xs text-slate-500">
                          {asset.laboratory.name}
                        </p>
                      )}
                      <span
                        className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[asset.status]}`}
                      >
                        {statusLabels[asset.status]}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
