"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surfaces a clear message in the browser console instead of a cryptic crash
  // if someone forgot to set up .env.local from .env.example.
  console.warn(
    "[CampusDesk] Missing Supabase env vars. Copy .env.example to .env.local and fill in your project's URL + anon key."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
