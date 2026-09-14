"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { StatusPill, PriorityTag } from "@/components/UI";
import { fetchAllComplaints, fetchDepartments, fetchAllProfiles, displayId } from "@/lib/data";

export default function AdminDashboardPage() {
  const [complaints, setComplaints] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    fetchAllComplaints().then(setComplaints).catch(() => setComplaints([]));
    fetchDepartments().then((d) => setDepartments(d || [])).catch(() => setDepartments([]));
    fetchAllProfiles()
      .then((rows) => setStudentCount((rows || []).filter((r) => r.role === "student").length))
      .catch(() => setStudentCount(0));
  }, []);

  const loading = complaints === null;
  const list = complaints || [];
  const total = list.length;
  const pending = list.filter((c) => c.status === "Pending").length;
  const resolved = list.filter((c) => c.status === "Resolved").length;

  return (
    <AppShell title="Admin Dashboard" requiredRole="admin" showNotif={false}>
      <div className="stat-grid">
        <StatCard label="Total students" value={studentCount} icon="\u{1F465}" tone="blue" />
        <StatCard label="Total complaints" value={total} icon="\u2630" tone="teal" />
        <StatCard label="Pending" value={pending} icon="\u23F3" tone="amber" />
        <StatCard label="Resolved" value={resolved} icon="\u2713" tone="green" />
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Complaints by department</h2></div>
        {loading ? (
          <p style={{ color: "var(--ink-faint)", fontSize: ".9rem" }}>Loading…</p>
        ) : (
          (departments || []).map((d) => {
            const count = list.filter((c) => c.department === d.name).length;
            const open = list.filter((c) => c.department === d.name && c.status !== "Resolved").length;
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <div key={d.id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".88rem", marginBottom: 6 }}>
                  <span><b>{d.name}</b></span>
                  <span style={{ color: "var(--ink-faint)" }}>{open} open · {count} total</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "var(--surface-alt)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "var(--primary)" }}></div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Latest complaints</h2>
          <Link href="/admin/complaints" className="btn btn-outline btn-sm">Manage all</Link>
        </div>
        {!loading && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Student</th><th>Category</th><th>Priority</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {complaints.slice(0, 6).map((c) => (
                  <tr key={c.id}>
                    <td className="id-tag mono">{displayId(c.id)}</td>
                    <td>{c.student_name}</td>
                    <td>{c.category}</td>
                    <td><PriorityTag priority={c.priority} /></td>
                    <td><StatusPill status={c.status} /></td>
                    <td><Link href="/admin/complaints" className="btn btn-ghost btn-sm">Manage</Link></td>
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
