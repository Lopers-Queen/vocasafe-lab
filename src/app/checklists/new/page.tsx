"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import AppShell from "@/components/AppShell";
import { dummyAssets, dummyChecklists } from "@/data/dummy-data";
import { getCurrentUser } from "@/lib/auth";
import { saveChecklistResult } from "@/lib/checklist-storage";
import type { ChecklistAnswer, ChecklistResponse } from "@/types";

export default function ChecklistFormPage() {
  return (
    <Suspense fallback={<AppShell><div className="animate-pulse h-64" /></AppShell>}>
      <ChecklistForm />
    </Suspense>
  );
}

function ChecklistForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetChecklistId = searchParams.get("checklistId") ?? "";

  const [checklistId, setChecklistId] = useState(presetChecklistId);
  const [assetId, setAssetId] = useState("");
  const [responses, setResponses] = useState<Record<string, { answer: ChecklistAnswer; note: string }>>({});
  const [overallNote, setOverallNote] = useState("");
  const [error, setError] = useState("");

  const checklist = dummyChecklists.find((cl) => cl.id === checklistId);
  const filteredAssets = checklist
    ? dummyAssets.filter((a) => a.kind === checklist.assetKind)
    : dummyAssets;

  function handleAnswerChange(itemId: string, answer: ChecklistAnswer) {
    setResponses((prev) => ({
      ...prev,
      [itemId]: { answer, note: prev[itemId]?.note ?? "" },
    }));
  }

  function handleNoteChange(itemId: string, note: string) {
    setResponses((prev) => ({
      ...prev,
      [itemId]: { answer: prev[itemId]?.answer ?? "tidak_berlaku", note },
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const user = getCurrentUser();
    if (!user) {
      setError("Silakan login terlebih dahulu.");
      return;
    }
    if (!checklist || !assetId) {
      setError("Pilih checklist dan aset.");
      return;
    }

    // Check all items have answers
    const unanswered = checklist.items.filter((item) => !responses[item.id]);
    if (unanswered.length > 0) {
      setError(`${unanswered.length} item belum dijawab.`);
      return;
    }

    const checklistResponses: ChecklistResponse[] = checklist.items.map((item) => ({
      itemId: item.id,
      answer: responses[item.id].answer,
      note: responses[item.id].note || undefined,
    }));

    saveChecklistResult({
      id: `CKR-${Date.now()}`,
      checklistId: checklist.id,
      assetId,
      inspectorUserId: user.id,
      completedAt: new Date().toISOString(),
      responses: checklistResponses,
      overallNote,
    });

    router.push("/checklists");
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/checklists"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <h1 className="text-2xl font-bold text-slate-900">Isi Checklist K3</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Template Checklist *
              </label>
              <select
                value={checklistId}
                onChange={(e) => {
                  setChecklistId(e.target.value);
                  setResponses({});
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="">Pilih checklist...</option>
                {dummyChecklists.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Aset *
              </label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="">Pilih aset...</option>
                {filteredAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Checklist items */}
          {checklist && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {checklist.title}
              </h2>
              {checklist.items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-md border p-4 ${
                    item.isCritical
                      ? "border-red-200 bg-red-50/50"
                      : "border-slate-100"
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <p className="text-sm font-medium text-slate-700">
                      {item.label}
                    </p>
                    {item.isCritical && (
                      <span className="text-xs bg-red-100 text-red-700 rounded px-1.5 py-0.5 font-medium">
                        Kritis
                      </span>
                    )}
                  </div>
                  {item.guidance && (
                    <p className="text-xs text-slate-500 mb-2">{item.guidance}</p>
                  )}
                  <div className="flex gap-2 mb-2">
                    {(["ya", "tidak", "tidak_berlaku"] as ChecklistAnswer[]).map(
                      (ans) => (
                        <button
                          key={ans}
                          type="button"
                          onClick={() => handleAnswerChange(item.id, ans)}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            responses[item.id]?.answer === ans
                              ? ans === "ya"
                                ? "bg-green-600 text-white"
                                : ans === "tidak"
                                ? "bg-red-600 text-white"
                                : "bg-slate-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {ans === "ya"
                            ? "Ya"
                            : ans === "tidak"
                            ? "Tidak"
                            : "N/A"}
                        </button>
                      )
                    )}
                  </div>
                  <input
                    type="text"
                    value={responses[item.id]?.note ?? ""}
                    onChange={(e) => handleNoteChange(item.id, e.target.value)}
                    placeholder="Catatan (opsional)"
                    className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-xs placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Overall note */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Catatan Keseluruhan
            </label>
            <textarea
              value={overallNote}
              onChange={(e) => setOverallNote(e.target.value)}
              rows={3}
              placeholder="Catatan umum hasil inspeksi..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
            />
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
            <Send className="h-4 w-4" /> Simpan Hasil Checklist
          </button>
        </form>
      </div>
    </AppShell>
  );
}
