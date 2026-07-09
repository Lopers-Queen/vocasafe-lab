"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ClipboardCheck,
  Loader2,
  Plus,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import {
  fetchActiveChecklistTemplates,
  fetchChecklistResults,
  type DatabaseChecklistResult,
  type DatabaseChecklistTemplate,
} from "@/lib/checklists";
import type { RiskLevel } from "@/types";

const riskColors: Record<RiskLevel, string> = {
  rendah: "bg-green-100 text-green-800",
  sedang: "bg-yellow-100 text-yellow-800",
  tinggi: "bg-orange-100 text-orange-800",
  kritis: "bg-red-100 text-red-800",
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function ChecklistsPage() {
  const [results, setResults] = useState<DatabaseChecklistResult[]>([]);
  const [templates, setTemplates] = useState<DatabaseChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    void Promise.all([
      fetchChecklistResults(),
      fetchActiveChecklistTemplates(),
    ]).then(([result, templateResult]) => {
      if (!active) return;
      setResults(result.results);
      setTemplates(templateResult.templates);
      const errors = [result.error, templateResult.error].filter(Boolean);
      setError(
        errors.length > 0
          ? `Data checklist tidak dapat dimuat dari Supabase: ${errors.join("; ")}`
          : "",
      );
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Checklist K3</h1>
            <p className="mt-1 text-sm text-slate-500">
              Hasil inspeksi K3 yang tersimpan di Supabase.
            </p>
          </div>
          <Link
            href="/checklists/new"
            className="inline-flex min-h-10 items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Isi Checklist
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
            <span className="text-sm text-slate-500">Memuat hasil checklist...</span>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Template Aktif
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Template dan item dimuat langsung dari Supabase.
                </p>
              </div>

              {templates.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
                  Belum ada template checklist aktif.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {templates.map((template) => (
                    <Link
                      key={template.id}
                      href={`/checklists/new?checklistId=${template.id}`}
                      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-emerald-100 p-2">
                          <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {template.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {template.items.length} item pemeriksaan
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {template.items.filter((item) => item.isCritical).length}{" "}
                            item kritis
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Hasil Checklist
              </h2>

              {results.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-slate-500">Belum ada hasil checklist di Supabase.</p>
          </div>
              ) : (
          <div className="space-y-3">
            {results.map((result) => (
              <article
                key={result.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-slate-900">
                      {result.template?.title ?? "Template tidak tersedia"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {result.asset
                        ? `${result.asset.name} (${result.asset.code})`
                        : "Tanpa aset terkait"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Pemeriksa: {result.inspector?.fullName ?? "Tidak tersedia"}
                      {" · "}
                      {new Date(result.completedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {result.riskCategory && result.riskScore !== null ? (
                    <span
                      className={`inline-flex self-start rounded-full px-2.5 py-0.5 text-xs font-medium ${riskColors[result.riskCategory]}`}
                    >
                      {capitalize(result.riskCategory)} &middot; {result.riskScore}
                    </span>
                  ) : (
                    <span className="inline-flex self-start rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      Tidak ada temuan
                    </span>
                  )}
                </div>

                {result.overallNote && (
                  <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                    {result.overallNote}
                  </p>
                )}
              </article>
            ))}
          </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
