"use client";

import { useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { canEditReportStatus } from "@/lib/role-access";
import { updateReport } from "@/lib/report-storage";
import type { HazardReport, ReportStatus } from "@/types";

const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: "baru", label: "Baru" },
  { value: "diverifikasi", label: "Diverifikasi" },
  { value: "dalam_penanganan", label: "Dalam Penanganan" },
  { value: "selesai", label: "Selesai" },
  { value: "ditolak", label: "Ditolak" },
];

const VALID_STATUSES = new Set<string>(STATUS_OPTIONS.map((o) => o.value));

interface FollowUpPanelProps {
  report: HazardReport;
  onUpdate: (updated: HazardReport) => void;
}

export default function FollowUpPanel({ report, onUpdate }: FollowUpPanelProps) {
  const user = getCurrentUser();
  const canEdit = user ? canEditReportStatus(user.role) : false;

  // Initialize dropdown from report.status. Fallback to "diverifikasi" only
  // if report.status is somehow invalid.
  const initialStatus: ReportStatus = VALID_STATUSES.has(report.status)
    ? report.status
    : "diverifikasi";

  const [selectedStatus, setSelectedStatus] = useState<ReportStatus>(initialStatus);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  function handleSave() {
    if (!user || !canEdit) return;
    if (!note.trim()) return;

    setSaving(true);

    updateReport(report.id, (r) => ({
      ...r,
      status: selectedStatus,
      statusHistory: [
        ...r.statusHistory,
        {
          status: selectedStatus,
          changedAt: new Date().toISOString(),
          changedByUserId: user.id,
          note: note.trim(),
        },
      ],
    }));

    // Build the updated report for parent
    const updated: HazardReport = {
      ...report,
      status: selectedStatus,
      statusHistory: [
        ...report.statusHistory,
        {
          status: selectedStatus,
          changedAt: new Date().toISOString(),
          changedByUserId: user.id,
          note: note.trim(),
        },
      ],
    };

    setNote("");
    setSaving(false);
    onUpdate(updated);
  }

  if (!canEdit) {
    return (
      <div className="rounded-md bg-slate-50 p-4">
        <p className="text-sm text-slate-500">
          Hanya teknisi atau admin yang dapat menambah tindak lanjut.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Status Laporan
        </label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as ReportStatus)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Catatan Tindak Lanjut
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Tuliskan catatan tindak lanjut..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !note.trim()}
        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "Menyimpan..." : "Simpan Tindak Lanjut"}
      </button>
    </div>
  );
}
