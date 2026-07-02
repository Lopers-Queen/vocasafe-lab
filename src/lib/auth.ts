"use client";

import type { User, UserRole } from "../types";
import { dummyUsers } from "../data/dummy-data";

const AUTH_KEY = "vocasafe_current_user";

export function login(role: UserRole): User {
  const user = dummyUsers.find((u) => u.role === role);
  if (!user) throw new Error(`No dummy user for role: ${role}`);
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  }
  return user;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin_lab: "Admin Laboratorium",
    auditor: "Auditor",
    teknisi: "Teknisi/Laboran",
  };
  return labels[role] ?? role;
}
