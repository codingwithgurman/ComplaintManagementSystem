"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    setProfile(data ?? null);
    return data ?? null;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function applySession(session) {
      if (!mounted) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setAuthError("");

      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        await loadProfile(nextUser.id);
      } catch (error) {
        console.error("[CampusDesk] Could not load the signed-in user's profile:", error);
        if (mounted) {
          setProfile(null);
          setAuthError(error.message || "Could not load your account profile.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Run Supabase queries after the auth callback has returned, avoiding
      // lock contention inside onAuthStateChange.
      setTimeout(() => {
        void applySession(session);
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback((userId) => {
    const id = userId || user?.id;
    if (id) return loadProfile(id);
  }, [user, loadProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, authError, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
