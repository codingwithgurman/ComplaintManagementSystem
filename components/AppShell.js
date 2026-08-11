"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

/**
 * Wraps a protected page. Redirects to the right login page if the
 * user isn't signed in, or isn't the expected role.
 *
 * requiredRole: "student" | "admin" | undefined (any signed-in user)
 */
export default function AppShell({ title, requiredRole, notifCount = 0, showNotif = true, children }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(requiredRole === "admin" ? "/admin/login" : "/login");
      return;
    }
    if (requiredRole && profile && profile.role !== requiredRole) {
      router.replace(profile.role === "admin" ? "/admin/dashboard" : "/dashboard");
    }
  }, [loading, user, profile, requiredRole, router]);

  if (loading || !user || (requiredRole && profile && profile.role !== requiredRole)) {
    return <div className="page-loading">Loading your workspace…</div>;
  }

  return (
    <div className="app-shell">
      <Sidebar role={profile?.role || requiredRole || "student"} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        <Topbar title={title} onToggleSidebar={() => setSidebarOpen((o) => !o)} notifCount={notifCount} showNotif={showNotif} />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
