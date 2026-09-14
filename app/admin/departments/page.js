"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/ToastProvider";
import AppShell from "@/components/AppShell";
import Field from "@/components/Field";
import { isRequired } from "@/lib/validate";
import { fetchDepartments, fetchAllComplaints, addDepartment, updateDepartment, deleteDepartment } from "@/lib/data";

export default function DepartmentsPage() {
  const toast = useToast();
  const [departments, setDepartments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [head, setHead] = useState("");
  const [errors, setErrors] = useState({});

  function load() {
    fetchDepartments().then(setDepartments).catch(() => {});
    fetchAllComplaints().then(setComplaints).catch(() => {});
  }
  useEffect(load, []);

  function openAdd() {
    setEditing(null);
    setName(""); setHead(""); setErrors({});
    setModalOpen(true);
  }
  function openEdit(d) {
    setEditing(d);
    setName(d.name); setHead(d.head); setErrors({});
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!isRequired(name)) errs.name = "Enter a department name.";
    if (!isRequired(head)) errs.head = "Enter the department head's name.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      if (editing) {
        await updateDepartment(editing.id, { name: name.trim(), head: head.trim() });
        toast("Department updated.", "success");
      } else {
        await addDepartment({ name: name.trim(), head: head.trim() });
        toast("Department added.", "success");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast(err.message || "Could not save department.", "error");
    }
  }

  async function handleDelete(d) {
    if (!confirm(`Delete "${d.name}"?`)) return;
    try {
      await deleteDepartment(d.id);
      toast("Department deleted.", "success");
      load();
    } catch (err) {
      toast(err.message || "Could not delete department.", "error");
    }
  }

  return (
    <AppShell title="Departments" requiredRole="admin" showNotif={false}>
      <div className="panel">
        <div className="panel-head">
          <h2>All departments</h2>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add department</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Head</th><th>Open complaints</th><th>Actions</th></tr></thead>
            <tbody>
              {departments.map((d) => {
                const open = complaints.filter((c) => c.department === d.name && c.status !== "Resolved").length;
                return (
                  <tr key={d.id}>
                    <td className="id-tag mono">D{String(d.id).padStart(2, "0")}</td>
                    <td>{d.name}</td>
                    <td>{d.head}</td>
                    <td>{open}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)}>Edit</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(d)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-head">
              <h3 style={{ margin: 0 }}>{editing ? "Edit department" : "Add department"}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <Field id="dept-name" label="Department name" error={errors.name}>
                <input type="text" id="dept-name" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field id="dept-head" label="Department head" error={errors.head}>
                <input type="text" id="dept-head" value={head} onChange={(e) => setHead(e.target.value)} />
              </Field>
              <button type="submit" className="btn btn-primary btn-block">Save department</button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
