"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  ClipboardList,
  Database,
  Loader2,
  Package,
  ShieldCheck,
  Users,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { getRoleLabel } from "@/lib/auth";
import {
  fetchAdminData,
  type AdminData,
  type AdminUserProfile,
} from "@/lib/admin";

const EMPTY_DATA: AdminData = {
  profiles: [],
  laboratories: [],
  assets: [],
  checklistTemplates: [],
  checklistItems: [],
};

const assetStatusLabels = {
  layak: "Layak",
  perlu_dicek: "Perlu dicek",
  tidak_layak: "Tidak layak",
};

const assetStatusColors = {
  layak: "bg-emerald-100 text-emerald-800",
  perlu_dicek: "bg-amber-100 text-amber-800",
  tidak_layak: "bg-red-100 text-red-800",
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ProfileCard({ profile }: { profile: AdminUserProfile }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900">
            {profile.fullName}
          </h3>
          <p className="truncate text-sm text-slate-500">{profile.email}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
            profile.isActive
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {profile.isActive ? "Aktif" : "Nonaktif"}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Role</dt>
          <dd className="font-medium text-slate-800">
            {getRoleLabel(profile.role)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Dibuat</dt>
          <dd className="font-medium text-slate-800">
            {formatDate(profile.createdAt)}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export default function AdminPage() {
  const [data, setData] = useState<AdminData>(EMPTY_DATA);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(true);

  useEffect(() => {
    let active = true;

    void fetchAdminData().then((result) => {
      if (!active) return;
      setData(result.data);
      setErrors(result.errors);
      setAuthorized(result.authorized);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
          <span className="text-sm text-slate-500">Memuat data admin...</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 pb-20 lg:pb-0">
        <header>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Administrasi Sistem</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Monitoring profil pengguna dan data dasar VocaSafe Lab dari Supabase.
          </p>
        </header>

        {errors.length > 0 && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">
                {authorized
                  ? "Sebagian data tidak dapat dimuat."
                  : "Akses data admin tidak tersedia."}
              </p>
              <ul className="mt-1 list-disc pl-5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {authorized && (
          <>
            <section className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-slate-900">
                      Profil Pengguna
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Daftar profil aplikasi. UUID tidak ditampilkan pada halaman ini.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {data.profiles.length} profil
                </span>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-semibold">Manajemen profil masih read-only.</p>
                <p className="mt-1">
                  Policy RLS saat ini mengizinkan admin membaca seluruh profil,
                  tetapi belum mengizinkan perubahan role atau status aktif.
                  Pengaturan ini akan dibahas pada D4-13.
                </p>
              </div>

              {data.profiles.length === 0 ? (
                <EmptyState message="Belum ada profil pengguna yang dapat ditampilkan." />
              ) : (
                <>
                  <div className="grid gap-3 md:hidden">
                    {data.profiles.map((profile) => (
                      <ProfileCard key={profile.id} profile={profile} />
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white md:block">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Nama</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Dibuat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.profiles.map((profile) => (
                          <tr key={profile.id}>
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {profile.fullName}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {profile.email}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {getRoleLabel(profile.role)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  profile.isActive
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {profile.isActive ? "Aktif" : "Nonaktif"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {formatDate(profile.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            <section className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-teal-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Data Dasar
                  </h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Data operasional ditampilkan read-only pada tahap D4-12.
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-emerald-600" />
                      <h3 className="font-semibold text-slate-900">Laboratorium</h3>
                    </div>
                    <span className="text-xs text-slate-500">
                      {data.laboratories.length} data
                    </span>
                  </div>
                  {data.laboratories.length === 0 ? (
                    <EmptyState message="Belum ada data laboratorium." />
                  ) : (
                    <div className="space-y-2">
                      {data.laboratories.map((laboratory) => (
                        <article
                          key={laboratory.id}
                          className="rounded-md border border-slate-100 p-3"
                        >
                          <div className="flex flex-wrap justify-between gap-2">
                            <div>
                              <p className="font-medium text-slate-900">
                                {laboratory.code} - {laboratory.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {laboratory.department ?? "Departemen belum diisi"}
                              </p>
                            </div>
                            <span className="text-xs text-slate-500">
                              {laboratory.location ?? "Lokasi belum diisi"}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-emerald-600" />
                      <h3 className="font-semibold text-slate-900">Aset</h3>
                    </div>
                    <span className="text-xs text-slate-500">
                      {data.assets.length} data
                    </span>
                  </div>
                  {data.assets.length === 0 ? (
                    <EmptyState message="Belum ada data aset." />
                  ) : (
                    <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                      {data.assets.map((asset) => (
                        <article
                          key={asset.id}
                          className="rounded-md border border-slate-100 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">
                                {asset.code} - {asset.name}
                              </p>
                              <p className="text-sm capitalize text-slate-500">
                                {asset.kind} &middot; {asset.location ?? "Tanpa lokasi"}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${assetStatusColors[asset.status]}`}
                            >
                              {assetStatusLabels[asset.status]}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-teal-600" />
                      <h3 className="font-semibold text-slate-900">
                        Template Checklist
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500">
                      {data.checklistTemplates.length} data
                    </span>
                  </div>
                  {data.checklistTemplates.length === 0 ? (
                    <EmptyState message="Belum ada template checklist." />
                  ) : (
                    <div className="space-y-2">
                      {data.checklistTemplates.map((template) => (
                        <article
                          key={template.id}
                          className="flex items-center justify-between gap-3 rounded-md border border-slate-100 p-3"
                        >
                          <p className="font-medium text-slate-900">{template.title}</p>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              template.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {template.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-teal-600" />
                      <h3 className="font-semibold text-slate-900">Item Checklist</h3>
                    </div>
                    <span className="text-xs text-slate-500">
                      {data.checklistItems.length} data
                    </span>
                  </div>
                  {data.checklistItems.length === 0 ? (
                    <EmptyState message="Belum ada item checklist." />
                  ) : (
                    <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                      {data.checklistItems.map((item) => (
                        <article
                          key={item.id}
                          className="flex items-start gap-3 rounded-md border border-slate-100 p-3"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700">
                            {item.sortOrder}
                          </span>
                          <p className="text-sm font-medium text-slate-800">
                            {item.label}
                          </p>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
