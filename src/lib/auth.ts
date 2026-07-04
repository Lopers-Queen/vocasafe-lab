"use client";

import type { AppUser, UserRole } from "../types";
import { createSupabaseBrowserClient } from "./supabase/client";

interface UserProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  laboratory_id?: string | null;
  is_active: boolean;
}

let cachedCurrentUser: AppUser | null = null;

export function clearCachedCurrentUser(): void {
  cachedCurrentUser = null;
}

function mapUserProfile(row: UserProfileRow): AppUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    laboratoryId: row.laboratory_id ?? null,
    isActive: row.is_active,
  };
}

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Supabase belum dikonfigurasi. Isi .env.local dengan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.";
}

export async function signInWithEmailPassword(email: string, password: string) {
  try {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { user: null, error: error.message };
    }

    return await getCurrentUserProfile();
  } catch (error) {
    return { user: null, error: getAuthErrorMessage(error) };
  }
}

export async function signOut(): Promise<{ error: string | null }> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message };
    }

    clearCachedCurrentUser();
    return { error: null };
  } catch (error) {
    return { error: getAuthErrorMessage(error) };
  }
}

export async function getCurrentSession() {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) return { session: null, error: error.message };
    return { session: data.session, error: null };
  } catch (error) {
    return { session: null, error: getAuthErrorMessage(error) };
  }
}

export async function getCurrentUserProfile(): Promise<{
  user: AppUser | null;
  error: string | null;
}> {
  try {
    const supabase = createSupabaseBrowserClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      cachedCurrentUser = null;
      return { user: null, error: authError?.message ?? null };
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id,email,full_name,role,laboratory_id,is_active")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      cachedCurrentUser = null;
      return { user: null, error: "Profil pengguna belum dibuat. Hubungi admin." };
    }

    const mapped = mapUserProfile(profile as UserProfileRow);
    if (!mapped.isActive) {
      cachedCurrentUser = null;
      return { user: null, error: "Akun tidak aktif. Hubungi admin." };
    }

    cachedCurrentUser = mapped;
    return { user: mapped, error: null };
  } catch (error) {
    cachedCurrentUser = null;
    return { user: null, error: getAuthErrorMessage(error) };
  }
}

/**
 * Temporary synchronous accessor for legacy client components that have not
 * been migrated yet. AppShell populates this cache after Supabase profile load.
 */
export function getCurrentUser(): AppUser | null {
  return cachedCurrentUser;
}

/** Backward-compatible alias for components still importing logout. */
export async function logout(): Promise<void> {
  const { error } = await signOut();
  if (error) throw new Error(error);
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    mahasiswa: "Mahasiswa",
    dosen: "Dosen",
    teknisi: "Teknisi/Laboran",
    kepala_lab: "Kepala Laboratorium",
    admin: "Admin Sistem",
  };
  return labels[role] ?? role;
}
