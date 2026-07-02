"use client";

import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { login, getRoleLabel } from "@/lib/auth";
import type { UserRole } from "@/types";

const roles: { role: UserRole; description: string }[] = [
  { role: "admin_lab", description: "Akses penuh: dashboard, laporan, checklist, audit, tindak lanjut" },
  { role: "auditor", description: "Inspeksi, laporan bahaya, checklist, audit report" },
  { role: "teknisi", description: "Tindak lanjut laporan, checklist, pemeliharaan alat" },
];

export default function LoginPage() {
  const router = useRouter();

  function handleLogin(role: UserRole) {
    login(role);
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-8 w-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">VocaSafe Lab</h1>
          </div>
          <p className="text-slate-500">Pilih role untuk masuk (demo)</p>
        </div>
        <div className="space-y-3">
          {roles.map(({ role, description }) => (
            <button
              key={role}
              onClick={() => handleLogin(role)}
              className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <p className="font-semibold text-slate-900">{getRoleLabel(role)}</p>
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
