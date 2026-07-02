"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Plus } from "lucide-react";
import AppShell from "@/components/AppShell";
import { dummyChecklists } from "@/data/dummy-data";
import { getChecklistResults, type ChecklistResult } from "@/lib/checklist-storage";

export default function ChecklistsPage() {
  const [results, setResults] = useState<ChecklistResult[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setResults(getChecklistResults());
  }, []);

  if (!mounted) return <AppShell><div className="animate-pulse h-64" /></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Checklist K3</h1>
          <Link
            href="/checklists/new"
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Isi Checklist
          </Link>
        </div>

        {/* Available checklists */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Template Checklist</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {dummyChecklists.map((cl) => (
              <Link
                key={cl.id}
                href={`/checklists/new?checklistId=${cl.id}`}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-emerald-100 p-2">
                    <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{cl.title}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {cl.items.length} item &middot;{" "}
                      {cl.assetKind === "alat" ? "Alat" : "Fasilitas"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {cl.items.filter((i) => i.isCritical).length} item kritis
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Completed checklists */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Hasil Checklist ({results.length})
            </h2>
            <div className="space-y-3">
              {results.map((r) => {
                const template = dummyChecklists.find(
                  (cl) => cl.id === r.checklistId
                );
                return (
                  <div
                    key={r.id}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <p className="font-medium text-slate-900">
                      {template?.title ?? r.checklistId}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(r.completedAt).toLocaleDateString("id-ID")} &middot;
                      Aset: {r.assetId}
                    </p>
                    {r.overallNote && (
                      <p className="text-sm text-slate-600 mt-1">{r.overallNote}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
