"use client";

import { createClient } from "@supabase/supabase-js";
import { firebaseAuth } from "./firebaseClient";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    "[CampusDesk] Missing Supabase data API settings. Copy .env.example to .env.local and fill in the project URL + publishable key."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabasePublishableKey || "missing-supabase-publishable-key",
  {
    // Firebase is the only session authority. Supabase receives the current
    // Firebase ID token for Database, Storage, Realtime, and Functions calls.
    accessToken: async () => {
      const user = firebaseAuth.currentUser;
      return user ? user.getIdToken(false) : null;
    },
  },
);
