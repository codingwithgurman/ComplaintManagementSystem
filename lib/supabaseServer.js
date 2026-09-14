import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "[CampusDesk Server] Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and key."
  );
}

/**
 * Server-side Supabase client for Route Handlers and Server Actions.
 */
export const supabaseServer = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "missing-supabase-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
