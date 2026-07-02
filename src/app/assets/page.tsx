"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import AppShell from "@/components/AppShell";
import { dummyAssets } from "@/data/dummy-data";

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

export default function AssetsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Daftar Aset</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dummyAssets.map((asset) => (
            <Link
              key={asset.id}
              href={`/assets/${asset.id}`}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-emerald-100 p-2">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{asset.name}</p>
                  <p className="text-sm text-slate-500">{asset.code} &middot; {asset.location}</p>
                  <p className="text-sm text-slate-500 mt-1">{asset.category}</p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[asset.status] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {statusLabels[asset.status] ?? asset.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
