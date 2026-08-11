"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import AppShell from "@/components/AppShell";
import { StatusPill, PriorityTag, EmptyState } from "@/components/UI";
import { fetchMyComplaints, formatDate, displayId, STATUSES } from "@/lib/data";

export default function MyComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (!user) return;
    fetchMyComplaints(user.id).then(setComplaints).catch(() => setComplaints([]));
  }, [user]);

  const filtered = useMemo(() => {
    if (!complaints) return [];
    let list = complaints;
    if (filter !== "All") list = list.filter((c) => c.status === filter);
    if (search.trim()) {
      const t = search.trim().toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(t) || displayId(c.id).toLowerCase().includes(t) || c.category.toLowerCase().includes(t));
    }
    return list;
  }, [complaints, filter, search]);

  return (
    <AppShell title="My Complaints" requiredRole="student">
      <div className="panel">
        <div className="table-toolbar">
          <div className="search-box">
            <input type="text" placeholder="Search by title, ID or category" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="filter-chips">
            {["All", ...STATUSES].map((s) => (
              <button key={s} className={`chip ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>{s}</button>
            ))}
          </div>
          <Link href="/complaints/new" className="btn btn-primary btn-sm">+ New complaint</Link>
        </div>

        {complaints === null ? (
          <p style={{ color: "var(--ink-faint)", fontSize: ".9rem" }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <EmptyState><p>No complaints match this view.</p></EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Date</th><th>Priority</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {filtered.map((c) => (
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
    </AppShell>
  );
}
