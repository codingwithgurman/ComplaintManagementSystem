"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/lib/ToastProvider";
import AppShell from "@/components/AppShell";
import { StatusPill, PriorityTag, EmptyState } from "@/components/UI";
import { fetchAllComplaints, fetchDepartments, updateComplaintStatus, deleteComplaint, displayId, STATUSES } from "@/lib/data";

export default function ManageComplaintsPage() {
  const toast = useToast();
  const [complaints, setComplaints] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState(null); // complaint being viewed in modal
  const [statusDraft, setStatusDraft] = useState("");
  const [deptDraft, setDeptDraft] = useState("");
  const [remarksDraft, setRemarksDraft] = useState("");

  function load() {
    fetchAllComplaints().then(setComplaints).catch(() => setComplaints([]));
  }

  useEffect(() => {
    load();
    fetchDepartments().then(setDepartments).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!complaints) return [];
    let list = complaints;
    if (filter !== "All") list = list.filter((c) => c.status === filter);
    if (search.trim()) {
      const t = search.trim().toLowerCase();
      list = list.filter((c) => displayId(c.id).toLowerCase().includes(t) || c.title.toLowerCase().includes(t) || (c.student_name || "").toLowerCase().includes(t));
    }
    return list;
  }, [complaints, filter, search]);

  function openModal(c) {
    setActive(c);
    setStatusDraft(c.status);
    setDeptDraft(c.department);
    setRemarksDraft(c.remarks || "");
  }

  async function handleSave() {
    try {
      await updateComplaintStatus(active.id, { status: statusDraft, department: deptDraft, remarks: remarksDraft.trim() });
      toast(`Complaint ${displayId(active.id)} updated.`, "success");
      setActive(null);
      load();
    } catch (err) {
      toast(err.message || "Could not update complaint.", "error");
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete complaint ${displayId(active.id)}? This cannot be undone.`)) return;
    try {
      await deleteComplaint(active.id);
      toast(`Complaint ${displayId(active.id)} deleted.`, "success");
      setActive(null);
      load();
    } catch (err) {
      toast(err.message || "Could not delete complaint.", "error");
    }
  }

  return (
    <AppShell title="Manage Complaints" requiredRole="admin" showNotif={false}>
      <div className="panel">
        <div className="table-toolbar">
          <div className="search-box">
            <input type="text" placeholder="Search by student, ID or title" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="filter-chips">
            {["All", ...STATUSES].map((s) => (
              <button key={s} className={`chip ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>{s}</button>
            ))}
          </div>
        </div>

        {complaints === null ? (
          <p style={{ color: "var(--ink-faint)", fontSize: ".9rem" }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <EmptyState><p>No complaints match this view.</p></EmptyState>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Student</th><th>Category</th><th>Department</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="id-tag mono">{displayId(c.id)}</td>
                    <td>{c.student_name}</td>
                    <td>{c.category}</td>
                    <td>{c.department}</td>
                    <td><PriorityTag priority={c.priority} /></td>
                    <td><StatusPill status={c.status} /></td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => openModal(c)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {active && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-head">
              <h3 style={{ margin: 0 }}>{displayId(active.id)} — {active.title}</h3>
              <button className="modal-close" onClick={() => setActive(null)}>&times;</button>
            </div>

            <div className="kv"><b>Student</b><span>{active.student_name}</span></div>
            <div className="kv"><b>Category</b><span>{active.category}</span></div>
            <div className="kv"><b>Filed</b><span>{new Date(active.created_at).toLocaleDateString("en-IN")}</span></div>
            <p style={{ marginTop: 14, fontSize: ".9rem" }}>{active.description}</p>
            {active.image_url && (
              <img src={active.image_url} alt="" style={{ maxHeight: 140, borderRadius: 8, border: "1px solid var(--line)", marginBottom: 10 }} />
            )}

            <div className="field">
              <label>Update status</label>
              <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Reassign department</label>
              <select value={deptDraft} onChange={(e) => setDeptDraft(e.target.value)}>
                {departments.map((d) => <option key={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Admin remarks</label>
              <textarea value={remarksDraft} onChange={(e) => setRemarksDraft(e.target.value)} placeholder="Add a note visible to the student" />
            </div>

            <div className="hero-actions" style={{ marginTop: 6 }}>
              <button className="btn btn-primary" onClick={handleSave}>Save changes</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
