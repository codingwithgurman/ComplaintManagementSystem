"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/lib/ToastProvider";
import AppShell from "@/components/AppShell";
import { EmptyState } from "@/components/UI";
import { fetchNotifications, markAllNotificationsRead, formatDateTime } from "@/lib/data";

const ICONS = {
  resolved: ["\u2713", "var(--success-tint)", "var(--success)"],
  assigned: ["\u{1F514}", "var(--primary-tint)", "var(--primary)"],
  info: ["\u2139", "var(--info-tint)", "var(--info)"],
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [notifs, setNotifs] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchNotifications(user.id).then(setNotifs).catch(() => setNotifs([]));
  }, [user]);

  async function handleMarkRead() {
    await markAllNotificationsRead(user.id);
    setNotifs((list) => list.map((n) => ({ ...n, read: true })));
    toast("All notifications marked as read.", "success");
  }

  return (
    <AppShell title="Notifications" requiredRole="student" showNotif={false}>
      <div className="content" style={{ maxWidth: 640, padding: 0 }}>
        <div className="panel" style={{ padding: 0 }}>
          <div className="panel-head" style={{ padding: "20px 24px 0" }}>
            <h2>All notifications</h2>
            <button className="btn btn-ghost btn-sm" onClick={handleMarkRead}>Mark all as read</button>
          </div>

          {notifs === null ? (
            <p style={{ color: "var(--ink-faint)", fontSize: ".9rem", padding: "0 24px 20px" }}>Loading…</p>
          ) : notifs.length === 0 ? (
            <EmptyState glyph="&#128276;"><p>You&apos;re all caught up — no notifications yet.</p></EmptyState>
          ) : (
            <div>
              {notifs.map((n) => {
                const [icon, bg, color] = ICONS[n.type] || ICONS.info;
                return (
                  <div className={`notif-item ${n.read ? "" : "unread"}`} key={n.id}>
                    <div className="notif-icon" style={{ background: bg, color }}>{icon}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: "var(--ink)", fontSize: ".92rem" }}>{n.text}</p>
                      <span className="notif-time">{formatDateTime(n.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
