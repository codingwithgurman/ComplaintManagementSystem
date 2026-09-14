"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/lib/ToastProvider";
import AppShell from "@/components/AppShell";
import Field from "@/components/Field";
import { updateProfile } from "@/lib/data";
import { isRequired, isPhone, passwordStrength } from "@/lib/validate";

const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

export default function ProfilePage() {
  const { user, profile, refreshProfile, changePassword } = useAuth();
  const toast = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(false);

  const [editForm, setEditForm] = useState({ name: "", phone: "", semester: "" });
  const [editErrors, setEditErrors] = useState({});

  const [passForm, setPassForm] = useState({ current: "", next: "", confirm: "" });
  const [passErrors, setPassErrors] = useState({});

  function openEdit() {
    setEditForm({ name: profile?.name || "", phone: profile?.phone || "", semester: profile?.semester || "" });
    setEditErrors({});
    setEditOpen(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!isRequired(editForm.name)) errs.name = "Enter your name.";
    if (!isPhone(editForm.phone)) errs.phone = "Enter a valid 10-digit number.";
    setEditErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      await updateProfile(user.id, { name: editForm.name.trim(), phone: editForm.phone.trim(), semester: editForm.semester });
      await refreshProfile();
      setEditOpen(false);
      toast("Profile updated successfully.", "success");
    } catch (err) {
      toast(err?.message || "Could not update profile.", "error");
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    const errs = {};
    const strength = passwordStrength(passForm.next);
    if (!isRequired(passForm.current)) errs.current = "Enter your current password.";
    if (strength < 3 || passForm.next.length < 8) errs.next = "Must be at least 8 characters with a number and symbol.";
    if (passForm.next !== passForm.confirm) errs.confirm = "Passwords do not match.";
    setPassErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      await changePassword({
        currentPassword: passForm.current,
        newPassword: passForm.next,
      });

      setPassOpen(false);
      setPassForm({ current: "", next: "", confirm: "" });
      toast("Password updated successfully.", "success");
    } catch (error) {
      toast(error?.message || "Could not update your password.", "error");
    }
  }

  if (!profile) {
    return (
      <AppShell title="Profile" requiredRole="student" showNotif={false}>
        <p style={{ color: "var(--ink-faint)", fontSize: ".9rem" }}>Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Profile" requiredRole="student" showNotif={false}>
      <div className="content" style={{ maxWidth: 640, padding: 0 }}>
        <div className="panel">
          <div className="profile-head">
            <div className="avatar">{profile.name?.charAt(0).toUpperCase()}</div>
            <div>
              <h2 style={{ marginBottom: 2 }}>{profile.name}</h2>
              <p style={{ margin: 0 }}>{profile.course} · Semester {profile.semester}</p>
            </div>
          </div>

          <div className="kv"><b>Roll number</b><span>{profile.roll}</span></div>
          <div className="kv"><b>Email</b><span>{profile.email}</span></div>
          <div className="kv"><b>Phone</b><span>{profile.phone}</span></div>
          <div className="kv"><b>Department</b><span>{profile.department}</span></div>
          <div className="kv"><b>Semester</b><span>{profile.semester}</span></div>

          <div className="hero-actions" style={{ marginTop: 22 }}>
            <button className="btn btn-primary" onClick={openEdit}>Edit profile</button>
            <button className="btn btn-outline" onClick={() => setPassOpen(true)}>Change password</button>
          </div>
        </div>
      </div>

      {editOpen && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-head">
              <h3 style={{ margin: 0 }}>Edit profile</h3>
              <button className="modal-close" onClick={() => setEditOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <Field id="edit-name" label="Full name" error={editErrors.name}>
                <input type="text" id="edit-name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
              </Field>
              <Field id="edit-phone" label="Phone number" error={editErrors.phone}>
                <input
                  type="tel" id="edit-phone" maxLength={10} value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                />
              </Field>
              <div className="field">
                <label>Semester</label>
                <select value={editForm.semester} onChange={(e) => setEditForm((f) => ({ ...f, semester: e.target.value }))}>
                  {SEMESTERS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-block">Save changes</button>
            </form>
          </div>
        </div>
      )}

      {passOpen && (
        <div className="modal-overlay open">
          <div className="modal">
            <div className="modal-head">
              <h3 style={{ margin: 0 }}>Change password</h3>
              <button className="modal-close" onClick={() => setPassOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <Field id="current-password" label="Current password" error={passErrors.current}>
                <input type="password" id="current-password" autoComplete="current-password" value={passForm.current} onChange={(e) => setPassForm((f) => ({ ...f, current: e.target.value }))} />
              </Field>
              <Field id="new-password" label="New password" error={passErrors.next}>
                <input type="password" id="new-password" autoComplete="new-password" value={passForm.next} onChange={(e) => setPassForm((f) => ({ ...f, next: e.target.value }))} />
              </Field>
              <Field id="confirm-new-password" label="Confirm new password" error={passErrors.confirm}>
                <input type="password" id="confirm-new-password" value={passForm.confirm} onChange={(e) => setPassForm((f) => ({ ...f, confirm: e.target.value }))} />
              </Field>
              <button type="submit" className="btn btn-primary btn-block">Update password</button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
