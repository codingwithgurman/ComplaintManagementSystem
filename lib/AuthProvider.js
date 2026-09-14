"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const refreshProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      if (data?.user && data?.profile) {
        setUser(data.user);
        setProfile(data.profile);
        setAuthError("");
        return data.profile;
      } else {
        setUser(null);
        setProfile(null);
        return null;
      }
    } catch (err) {
      console.error("[CampusDesk] Could not fetch current session:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;

        if (data?.user && data?.profile) {
          setUser(data.user);
          setProfile(data.profile);
          setAuthError("");
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("[CampusDesk] Could not initialize auth session:", error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setAuthError("Could not load your account session.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async ({ email, password, requiredRole }) => {
    setAuthError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, requiredRole }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Login failed.");
    }

    setUser(data.user);
    setProfile(data.profile);
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    setAuthError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Registration failed.");
    }

    setUser(data.user);
    setProfile(data.profile);
    return data;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("[CampusDesk] Error calling logout API:", err);
    } finally {
      setUser(null);
      setProfile(null);
      setAuthError("");
    }
  }, []);

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Could not change password.");
    }
    return data;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        authError,
        login,
        register,
        signOut,
        refreshProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
