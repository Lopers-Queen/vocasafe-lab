import { createBrowserClient } from "@supabase/ssr";

function getPublicSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Fill .env.local before using Supabase client.",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Browser Supabase client for Client Components.
 * Never reads or exposes SUPABASE_SERVICE_ROLE_KEY.
 */
export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabaseAnonKey } = getPublicSupabaseEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
