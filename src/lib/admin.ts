"use client";

import { getCurrentUserProfile } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

export interface AdminUserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string | null;
}

export interface AdminLaboratory {
  id: string;
  code: string;
  name: string;
  department: string | null;
  location: string | null;
}

export interface AdminAsset {
  id: string;
  code: string;
  name: string;
  kind: "alat" | "fasilitas";
  status: "layak" | "perlu_dicek" | "tidak_layak";
  location: string | null;
}

export interface AdminChecklistTemplate {
  id: string;
  title: string;
  isActive: boolean;
}

export interface AdminChecklistItem {
  id: string;
  label: string;
  sortOrder: number;
}

export interface AdminData {
  profiles: AdminUserProfile[];
  laboratories: AdminLaboratory[];
  assets: AdminAsset[];
  checklistTemplates: AdminChecklistTemplate[];
  checklistItems: AdminChecklistItem[];
}

interface UserProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string | null;
}

interface LaboratoryRow {
  id: string;
  code: string;
  name: string;
  department: string | null;
  location: string | null;
}

interface AssetRow {
  id: string;
  code: string;
  name: string;
  kind: "alat" | "fasilitas";
  status: "layak" | "perlu_dicek" | "tidak_layak";
  location: string | null;
}

interface ChecklistTemplateRow {
  id: string;
  title: string;
  is_active: boolean;
}

interface ChecklistItemRow {
  id: string;
  label: string;
  sort_order: number;
}

const EMPTY_ADMIN_DATA: AdminData = {
  profiles: [],
  laboratories: [],
  assets: [],
  checklistTemplates: [],
  checklistItems: [],
};

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Data admin tidak dapat dimuat dari Supabase.";
}

export async function fetchAdminData(): Promise<{
  data: AdminData;
  errors: string[];
  authorized: boolean;
}> {
  try {
    const { user, error: profileError } = await getCurrentUserProfile();

    if (!user || profileError) {
      return {
        data: EMPTY_ADMIN_DATA,
        errors: [profileError ?? "Sesi pengguna tidak ditemukan."],
        authorized: false,
      };
    }

    if (user.role !== "admin") {
      return {
        data: EMPTY_ADMIN_DATA,
        errors: ["Akses halaman admin hanya tersedia untuk Admin Sistem."],
        authorized: false,
      };
    }

    const supabase = createSupabaseBrowserClient();
    const [profiles, laboratories, assets, templates, items] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("id,full_name,email,role,is_active,created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("laboratories")
        .select("id,code,name,department,location")
        .order("code", { ascending: true }),
      supabase
        .from("assets")
        .select("id,code,name,kind,status,location")
        .order("code", { ascending: true }),
      supabase
        .from("checklist_templates")
        .select("id,title,is_active")
        .order("title", { ascending: true }),
      supabase
        .from("checklist_items")
        .select("id,label,sort_order")
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true }),
    ]);

    const errors: string[] = [];
    if (profiles.error) errors.push(`Profil pengguna: ${profiles.error.message}`);
    if (laboratories.error)
      errors.push(`Laboratorium: ${laboratories.error.message}`);
    if (assets.error) errors.push(`Aset: ${assets.error.message}`);
    if (templates.error)
      errors.push(`Template checklist: ${templates.error.message}`);
    if (items.error) errors.push(`Item checklist: ${items.error.message}`);

    return {
      data: {
        profiles: ((profiles.data ?? []) as UserProfileRow[]).map((row) => ({
          id: row.id,
          fullName: row.full_name,
          email: row.email,
          role: row.role,
          isActive: row.is_active,
          createdAt: row.created_at,
        })),
        laboratories: ((laboratories.data ?? []) as LaboratoryRow[]).map(
          (row) => ({ ...row }),
        ),
        assets: ((assets.data ?? []) as AssetRow[]).map((row) => ({ ...row })),
        checklistTemplates: (
          (templates.data ?? []) as ChecklistTemplateRow[]
        ).map((row) => ({
          id: row.id,
          title: row.title,
          isActive: row.is_active,
        })),
        checklistItems: ((items.data ?? []) as ChecklistItemRow[]).map(
          (row) => ({
            id: row.id,
            label: row.label,
            sortOrder: row.sort_order,
          }),
        ),
      },
      errors,
      authorized: true,
    };
  } catch (error) {
    return {
      data: EMPTY_ADMIN_DATA,
      errors: [errorMessage(error)],
      authorized: false,
    };
  }
}
