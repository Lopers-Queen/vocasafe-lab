"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import { dummyAssets } from "@/data/dummy-data";

export default function ScanPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  function handleScan() {
    setError("");
    // Accept QR value like vocasafe://assets/AST-001 or just AST-001
    let assetId = input.trim();
    const match = assetId.match(/vocasafe:\/\/assets\/(.+)/);
    if (match) assetId = match[1];

    const asset = dummyAssets.find(
      (a) => a.id === assetId || a.qrValue === input.trim()
    );
    if (asset) {
      router.push(`/assets/${asset.id}`);
    } else {
      setError("Aset tidak ditemukan. Pastikan kode QR benar.");
    }
  }

  return (
    <AppShell>
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Simulasi Scan QR</h1>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="rounded-full bg-emerald-100 p-4">
              <QrCode className="h-10 w-10 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-500 text-center">
              Masukkan kode QR atau ID aset untuk simulasi scan.
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="Contoh: AST-001 atau vocasafe://assets/AST-001"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={handleScan}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <Search className="h-4 w-4" /> Cari Aset
            </button>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400 mb-2">Aset tersedia untuk demo:</p>
            <div className="space-y-1">
              {dummyAssets.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setInput(a.qrValue);
                    setError("");
                  }}
                  className="block w-full text-left text-sm text-emerald-600 hover:text-emerald-800 hover:underline"
                >
                  {a.id} — {a.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
