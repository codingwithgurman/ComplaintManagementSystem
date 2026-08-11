"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";

export default function Topbar({ title, onToggleSidebar, notifCount = 0, showNotif = true }) {
  const { profile, user } = useAuth();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ccms_theme");
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      setDark(true);
    }
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("ccms_theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("ccms_theme", "light");
    }
  }

  const displayName = profile?.name || user?.email || "Guest";
  const roleLabel = profile?.role === "admin" ? "Administrator" : "Student";
  const initial = displayName.trim().charAt(0).toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="sidebar-toggle" aria-label="Toggle sidebar" onClick={onToggleSidebar}>
          <span></span><span></span><span></span>
        </button>
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="topbar-right">
        <button className="icon-btn" onClick={toggleTheme} title="Toggle dark mode">&#9788;</button>
        {showNotif && (
          <Link href="/notifications" className="icon-btn" title="Notifications">
            &#128276;
            {notifCount > 0 && <span className="badge-dot"></span>}
          </Link>
        )}
        <div className="user-chip">
          <div className="avatar">{initial}</div>
          <div className="who">
            <b>{displayName}</b>
            <span>{roleLabel}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
