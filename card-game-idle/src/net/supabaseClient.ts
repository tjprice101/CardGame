// Singleton Supabase client.
//
// Inert until VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are provided at build time.
// Add them to a `.env.local` file next to package.json (gitignored by Vite default):
//   VITE_SUPABASE_URL=https://<project>.supabase.co
//   VITE_SUPABASE_ANON_KEY=<anon-public-key>
//
// `getSupabase()` returns null when unconfigured so callers can no-op gracefully
// (single-player builds, CI, screenshots) instead of throwing at startup.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    cached = null;
    return null;
  }
  cached = createClient(url, key, {
    auth: {
      // Electron has stable localStorage so default persistSession behavior is fine.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}
