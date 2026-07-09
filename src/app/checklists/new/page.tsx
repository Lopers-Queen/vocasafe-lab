"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { fetchAssets, type DatabaseAsset } from "@/lib/assets";
import {
  createChecklistResult,
  fetchActiveChecklistTemplates,
  type DatabaseChecklistTemplate,
} from "@/lib/checklists";
import { calculateRiskScore } from "@/lib/risk-scoring";
import type { ChecklistAnswer } from "@/types";

interface AnswerState {
  answer: ChecklistAnswer;
  note: string;
}

const answerOptions: { value: ChecklistAnswer; label: string }[] = [
  { value: "ya", label: "Ya" },
  { value: "tidak", label: "Tidak" },
  { value: "tidak_berlaku", label: "Tidak Berlaku" },
];

function ChecklistFormFallback() {
  return (
    <AppShell>
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
        <span className="text-sm text-slate-500">Memuat checklist...</span>
      </div>
    </AppShell>
  );
}

export default function ChecklistFormPage() {
  return (
    <Suspense fallback={<ChecklistFormFallback />}>
      <ChecklistForm />
    </Suspense>
  );
}

function ChecklistForm() {
  const searchParams = useSearchParams();
  const presetTemplateId = searchParams.get("checklistId")?.trim() ?? "";
  const presetAssetId = searchParams.get("assetId")?.trim() ?? "";
  const [templates, setTemplates] = useState<DatabaseChecklistTemplate[]>([]);
  const [assets, setAssets] = useState<DatabaseAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupError, setSetupError] = useState("");
  const [setupWarning, setSetupWarning] = useState("");
  const [activeTemplate, setActiveTemplate] =
    useState<DatabaseChecklistTemplate | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [responses, setResponses] = useState<Record<string, AnswerState>>({});
  const [overallNote, setOverallNote] = useState("");
  const [hasRiskFinding, setHasRiskFinding] = useState(false);
  const [severity, setSeverity] = useState(3);
  const [probability, setProbability] = useState(3);
  const [exposure, setExposure] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdResultId, setCreatedResultId] = useState("");
  const [submissionWarning, setSubmissionWarning] = useState("");

  useEffect(() => {
    let active = true;

    void Promise.all([fetchActiveChecklistTemplates(), fetchAssets()]).then(
      ([templateResult, assetResult]) => {
        if (!active) return;

        setTemplates(templateResult.templates);
        setAssets(assetResult.assets);
        setLoading(false);

        const errors = [templateResult.error, assetResult.error].filter(Boolean);
        if (errors.length > 0) {
          setSetupError(`Data form tidak dapat dimuat: ${errors.join("; ")}`);
          return;
        }

        let initialTemplate = templateResult.templates[0] ?? null;
        if (presetTemplateId) {
          const matchedTemplate = templateResult.templates.find(
            (template) => template.id === presetTemplateId,
          );
          if (matchedTemplate) {
            initialTemplate = matchedTemplate;
          } else {
            setSetupWarning(
              "Template dari URL tidak ditemukan. Template aktif pertama digunakan.",
            );
          }
        }

        if (initialTemplate) setActiveTemplate(initialTemplate);

        if (presetAssetId) {
          const matchedAsset = assetResult.assets.find(
            (asset) =>
              asset.id === presetAssetId ||
              asset.code.toLowerCase() === presetAssetId.toLowerCase(),
          );
          if (matchedAsset) {
            setSelectedAssetId(matchedAsset.id);
          } else {
            setSetupWarning((current) =>
              [current, `Aset ${presetAssetId} tidak ditemukan. Pilih aset manual.`]
                .filter(Boolean)
                .join(" "),
            );
          }
        }
      },
    );

    return () => {
      active = false;
    };
  }, [presetAssetId, presetTemplateId]);

  const checklistItems = activeTemplate?.items ?? [];
  const filteredAssets = activeTemplate?.assetKind
    ? assets.filter((asset) => asset.kind === activeTemplate.assetKind)
    : assets;
  const selectedAsset =
    assets.find((asset) => asset.id === selectedAssetId) ?? null;
  const hasNegativeAnswer = Object.values(responses).some(
    (response) => response.answer === "tidak",
  );
  const riskFindingActive = hasRiskFinding || hasNegativeAnswer;
  const riskPreview = riskFindingActive
    ? calculateRiskScore({ severity, probability, exposure })
    : null;

  function handleTemplateChange(nextTemplateId: string) {
    const nextTemplate = templates.find(
      (template) => template.id === nextTemplateId,
    ) ?? null;
    setActiveTemplate(nextTemplate);
    setResponses({});
    setError("");

    if (
      nextTemplate?.assetKind &&
      selectedAsset &&
      selectedAsset.kind !== nextTemplate.assetKind
    ) {
      setSelectedAssetId("");
    }
  }

  function handleAnswerChange(itemId: string, answer: ChecklistAnswer) {
    setResponses((current) => ({
      ...current,
      [itemId]: {
        answer,
        note: current[itemId]?.note ?? "",
      },
    }));
    setError("");
  }

  function handleNoteChange(itemId: string, note: string) {
    setResponses((current) => ({
      ...current,
      [itemId]: {
        answer: current[itemId].answer,
        note,
      },
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!activeTemplate?.id) {
      setError("Template checklist aktif tidak ditemukan.");
      return;
    }

    if (checklistItems.length === 0) {
      setError("Item checklist belum tersedia.");
      return;
    }

    if (!selectedAssetId || !selectedAsset) {
      setError("Pilih aset terlebih dahulu.");
      return;
    }

    const unanswered = checklistItems.filter((item) => !responses[item.id]);
    if (unanswered.length > 0) {
      setError(`${unanswered.length} item checklist belum dijawab.`);
      return;
    }

    const negativeWithoutNote = checklistItems.some(
      (item) =>
        responses[item.id]?.answer === "tidak" &&
        !responses[item.id]?.note.trim(),
    );
    if (negativeWithoutNote) {
      setError("Catatan wajib diisi untuk setiap jawaban Tidak.");
      return;
    }

    setSubmitting(true);
    const result = await createChecklistResult({
      templateId: activeTemplate.id,
      assetId: selectedAssetId,
      laboratoryId: selectedAsset.laboratoryId,
      overallNote,
      hasRiskFinding: riskFindingActive,
      riskInput: { severity, probability, exposure },
      answers: checklistItems.map((item) => ({
        itemId: item.id,
        answer: responses[item.id].answer,
        note: responses[item.id].note,
      })),
    });

    if (result.error && result.resultSaved) {
      setSubmissionWarning(result.error);
      setCreatedResultId(result.resultId ?? "saved");
      setSubmitting(false);
      return;
    }

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setCreatedResultId(result.resultId ?? "saved");
    setSubmitting(false);
  }

  function resetForm() {
    setResponses({});
    setOverallNote("");
    setHasRiskFinding(false);
    setSeverity(3);
    setProbability(3);
    setExposure(3);
    setError("");
    setSubmissionWarning("");
    setCreatedResultId("");
  }

  if (createdResultId) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl">
          <section className="rounded-lg border border-emerald-200 bg-white p-6 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="mt-4 text-2xl font-bold text-slate-900">
              Checklist Berhasil Disimpan
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Hasil {activeTemplate?.title} untuk {selectedAsset?.name} telah
              disimpan ke Supabase.
            </p>
            {riskPreview && (
              <p className="mt-2 text-sm font-medium text-slate-700">
                Skor risiko {riskPreview.score} ({riskPreview.category})
              </p>
            )}
            {submissionWarning && (
              <p
                role="alert"
                className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-800"
              >
                {submissionWarning}
              </p>
            )}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Isi Checklist Baru
              </button>
              <Link
                href="/checklists"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Lihat Daftar Checklist
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
          href="/checklists"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Isi Checklist K3</h1>
          <p className="mt-1 text-sm text-slate-500">
            Isi template aktif dan simpan hasil pemeriksaan ke Supabase.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center rounded-lg border border-slate-200 bg-white">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
            <span className="text-sm text-slate-500">Memuat template dan aset...</span>
          </div>
        ) : setupError ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> {setupError}
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
            Belum ada template checklist aktif di Supabase.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div>
                <label
                  htmlFor="checklist-template"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Template Checklist *
                </label>
                <select
                  id="checklist-template"
                  value={activeTemplate?.id ?? ""}
                  onChange={(event) => handleTemplateChange(event.target.value)}
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Pilih template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="checklist-asset"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Aset Terkait *
                </label>
                <select
                  id="checklist-asset"
                  value={selectedAssetId}
                  onChange={(event) => setSelectedAssetId(event.target.value)}
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Pilih aset...</option>
                  {filteredAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.code})
                    </option>
                  ))}
                </select>
              </div>

              {setupWarning && (
                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {setupWarning}
                </p>
              )}

              {process.env.NODE_ENV === "development" && (
                <dl className="grid gap-1 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-[9rem_1fr]">
                  <dt>Template ID</dt>
                  <dd className="break-all">
                    {activeTemplate?.id ?? "Belum tersedia"}
                  </dd>
                  <dt>Asset ID</dt>
                  <dd className="break-all">
                    {selectedAssetId || "Belum dipilih"}
                  </dd>
                  <dt>Jumlah aset</dt>
                  <dd>{assets.length}</dd>
                  <dt>Jumlah item</dt>
                  <dd>{checklistItems.length}</dd>
                </dl>
              )}
            </section>

            {activeTemplate && (
              <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {activeTemplate.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {checklistItems.length} item pemeriksaan
                  </p>
                </div>

                {checklistItems.map((item, index) => {
                  const response = responses[item.id];
                  return (
                    <fieldset
                      key={item.id}
                      className={`rounded-md border p-4 ${
                        item.isCritical
                          ? "border-red-200 bg-red-50/40"
                          : "border-slate-200"
                      }`}
                    >
                      <legend className="px-1 text-sm font-semibold text-slate-800">
                        {index + 1}. {item.label}
                      </legend>
                      {item.guidance && (
                        <p className="mb-3 mt-1 text-xs text-slate-500">
                          {item.guidance}
                        </p>
                      )}

                      <div className="grid gap-2 sm:grid-cols-3">
                        {answerOptions.map((option) => (
                          <label
                            key={option.value}
                            className={`flex min-h-10 cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                              response?.answer === option.value
                                ? option.value === "ya"
                                  ? "border-green-600 bg-green-600 text-white"
                                  : option.value === "tidak"
                                    ? "border-red-600 bg-red-600 text-white"
                                    : "border-slate-600 bg-slate-600 text-white"
                                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`answer-${item.id}`}
                              value={option.value}
                              checked={response?.answer === option.value}
                              onChange={() => handleAnswerChange(item.id, option.value)}
                              className="sr-only"
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>

                      <label
                        htmlFor={`note-${item.id}`}
                        className="mt-3 block text-xs font-medium text-slate-600"
                      >
                        Catatan {response?.answer === "tidak" ? "*" : "(opsional)"}
                      </label>
                      <input
                        id={`note-${item.id}`}
                        type="text"
                        value={response?.note ?? ""}
                        onChange={(event) =>
                          handleNoteChange(item.id, event.target.value)
                        }
                        required={response?.answer === "tidak"}
                        disabled={!response}
                        placeholder={
                          response?.answer === "tidak"
                            ? "Jelaskan temuan yang perlu ditindaklanjuti"
                            : "Catatan item"
                        }
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </fieldset>
                  );
                })}
              </section>
            )}

            <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={hasRiskFinding}
                  onChange={(event) => setHasRiskFinding(event.target.checked)}
                  className="h-4 w-4 accent-emerald-600"
                />
                Ada temuan risiko tambahan?
              </label>

              {hasNegativeAnswer && (
                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Temuan risiko otomatis aktif karena terdapat jawaban Tidak.
                </p>
              )}

              {riskFindingActive && (
                <div className="space-y-4">
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

                  {riskPreview && (
                    <div className="rounded-md bg-slate-50 p-4">
                      <p className="text-sm text-slate-600">
                        Skor Risiko: <strong>{riskPreview.score}</strong>{" "}
                        <span
                          className={`ml-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            riskPreview.category === "rendah"
                              ? "bg-green-100 text-green-800"
                              : riskPreview.category === "sedang"
                                ? "bg-yellow-100 text-yellow-800"
                                : riskPreview.category === "tinggi"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                          {riskPreview.category.charAt(0).toUpperCase() +
                            riskPreview.category.slice(1)}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {riskPreview.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <label
                htmlFor="overall-note"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Catatan Keseluruhan
              </label>
              <textarea
                id="overall-note"
                value={overallNote}
                onChange={(event) => setOverallNote(event.target.value)}
                rows={3}
                placeholder="Catatan umum hasil inspeksi..."
                className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
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
              disabled={submitting}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Simpan Hasil Checklist
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
