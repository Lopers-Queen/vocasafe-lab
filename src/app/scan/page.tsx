"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Loader2, QrCode, Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import { fetchAssetByLookup } from "@/lib/assets";

const EXAMPLE_INPUTS = ["AST-001", "vocasafe://assets/AST-001"];

export default function ScanPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const lookup = input.trim();
    if (!lookup) {
      setError("Masukkan kode aset atau payload QR terlebih dahulu.");
      return;
    }

    setError("");
    setLoading(true);

    const result = await fetchAssetByLookup(lookup);

    if (result.error) {
      setError(`Data aset tidak dapat diperiksa: ${result.error}`);
      setLoading(false);
      return;
    }

    if (!result.asset) {
      setError("Aset tidak ditemukan. Pastikan kode atau payload QR benar.");
      setLoading(false);
      return;
    }

    router.push(`/assets/${encodeURIComponent(result.asset.code)}`);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Scan QR / Input Kode Aset
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cari alat atau fasilitas berdasarkan data asset di Supabase.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col items-center gap-4">
            <div className="rounded-full bg-emerald-100 p-4">
              <QrCode className="h-10 w-10 text-emerald-600" />
            </div>
            <p className="text-center text-sm text-slate-500">
              Masukkan kode aset atau payload QR untuk membuka detail aset.
            </p>
          </div>

          <form onSubmit={handleScan} className="space-y-4">
            <label htmlFor="asset-lookup" className="block text-sm font-medium text-slate-700">
              Kode aset atau payload QR
            </label>
            <input
              id="asset-lookup"
              type="text"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setError("");
              }}
              placeholder="Contoh: AST-001 atau vocasafe://assets/AST-001"
              autoComplete="off"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />

            {error && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Memeriksa Aset...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" /> Buka Detail Aset
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-medium text-slate-500">Contoh input:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_INPUTS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setInput(example);
                    setError("");
                  }}
                  className="max-w-full break-all rounded-md bg-emerald-50 px-3 py-2 text-left text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-md border border-sky-100 bg-sky-50 p-3 text-xs text-sky-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Pemindaian kamera QR belum diaktifkan. Integrasi kamera akan
              ditambahkan pada tahap berikutnya; input manual tetap tersedia
              sebagai fallback.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
