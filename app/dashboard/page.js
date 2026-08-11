"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import AppShell from "@/components/AppShell";
import { StatusPill, PriorityTag, EmptyState } from "@/components/UI";
import { fetchMyComplaints, unreadNotificationCount, formatDate, displayId } from "@/lib/data";

export default function DashboardPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState(null);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchMyComplaints(user.id).then(setComplaints).catch(() => setComplaints([]));
    unreadNotificationCount(user.id).then(setNotifCount).catch(() => {});
  }, [user]);

  const loadingList = complaints === null;
  const total = complaints?.length || 0;
  const pending = complaints?.filter((c) => c.status === "Pending").length || 0;
  const progress = complaints?.filter((c) => c.status === "In Progress").length || 0;
  const resolved = complaints?.filter((c) => c.status === "Resolved").length || 0;

  return (
    <AppShell title="Dashboard" requiredRole="student" notifCount={notifCount}>
      <div className="stat-grid">
        <StatCard label="Total complaints" value={total} icon="\u2630" tone="blue" />
        <StatCard label="Pending" value={pending} icon="\u23F3" tone="amber" />
        <StatCard label="In progress" value={progress} icon="\u21BB" tone="teal" />
        <StatCard label="Resolved" value={resolved} icon="\u2713" tone="green" />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Recent complaints</h2>
          <Link href="/complaints" className="btn btn-outline btn-sm">View all</Link>
        </div>

        {loadingList ? (
          <p style={{ color: "var(--ink-faint)", fontSize: ".9rem" }}>Loading…</p>
        ) : total === 0 ? (
          <EmptyState>
            <p>No complaints yet. Filed one recently? It&apos;ll show up here.</p>
            <Link href="/complaints/new" className="btn btn-primary btn-sm">File your first complaint</Link>
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>ID</th><th>Title</th><th>Category</th><th>Date</th><th>Priority</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {complaints.slice(0, 5).map((c) => (
                  <tr key={c.id}>
                    <td className="id-tag mono">{displayId(c.id)}</td>
                    <td>{c.title}</td>
                    <td>{c.category}</td>
                    <td>{formatDate(c.created_at)}</td>
                    <td><PriorityTag priority={c.priority} /></td>
                    <td><StatusPill status={c.status} /></td>
                    <td><Link href={`/complaints/${c.id}`} className="btn btn-ghost btn-sm">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Quick actions</h2></div>
        <div className="hero-actions" style={{ marginTop: 0 }}>
          <Link href="/complaints/new" className="btn btn-primary">File a new complaint</Link>
          <Link href="/track" className="btn btn-outline">Track a complaint</Link>
          <Link href="/chatbot" className="btn btn-outline">Ask the AI help desk</Link>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, icon, tone }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className={`stat-icon ${tone}`}>{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
