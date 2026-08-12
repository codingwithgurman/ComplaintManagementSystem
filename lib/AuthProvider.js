"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { firebaseAuth } from "./firebaseClient";
import { ensureSupabaseClaim, signOutFromFirebase } from "./firebaseAuth";
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
      return;
    }
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw error;
    setProfile(data ?? null);
    return data ?? null;
  }, []);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onIdTokenChanged(firebaseAuth, async (firebaseUser) => {
      if (!mounted) return;
      setLoading(true);
      setAuthError("");

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser({
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        displayName: firebaseUser.displayName,
      });

      try {
        const token = await firebaseUser.getIdTokenResult();
        if (token.claims.role !== "authenticated") {
          await ensureSupabaseClaim(firebaseUser);
        }
        await loadProfile(firebaseUser.uid);
      } catch (error) {
        console.error("[CampusDesk] Could not initialize the authenticated session:", error);
        if (mounted) {
          setProfile(null);
          setAuthError(error.message || "Could not initialize your session.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await signOutFromFirebase();
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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
