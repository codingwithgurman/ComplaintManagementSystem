"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/lib/ToastProvider";
import { isRequired, isEmail, isPhone, passwordStrength, strengthLabel, strengthColor } from "@/lib/validate";
import Field from "@/components/Field";

const DEPARTMENTS = ["Computer Science", "Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Business Administration", "Commerce"];
const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const { refreshProfile } = useAuth();

  const [form, setForm] = useState({
    name: "", roll: "", department: "", course: "", semester: "",
    email: "", phone: "", password: "", confirm: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const e = {};
    if (!isRequired(form.name)) e.name = "Enter your full name.";
    if (!isRequired(form.roll)) e.roll = "Enter your roll number.";
    if (!isRequired(form.department)) e.department = "Select your department.";
    if (!isRequired(form.course)) e.course = "Enter your course.";
    if (!isRequired(form.semester)) e.semester = "Select your semester.";
    if (!isRequired(form.email) || !isEmail(form.email)) e.email = "Enter a valid email address.";
    if (!isPhone(form.phone)) e.phone = "Enter a valid 10-digit phone number.";
    const strength = passwordStrength(form.password);
    if (strength < 3 || form.password.length < 8) e.password = "Password must be at least 8 characters, with a number and a symbol.";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            name: form.name.trim(),
            roll: form.roll.trim().toUpperCase(),
            phone: form.phone.trim(),
            department: form.department,
            course: form.course.trim(),
            semester: form.semester,
          },
        },
      });
      if (error) throw error;

      if (data.session && data.user) {
        await refreshProfile(data.user.id);
        toast("Account created! Redirecting...", "success");
        router.push("/dashboard");
      } else {
        toast("Account created! Check your email to confirm, then log in.", "success");
        router.push("/login");
      }
    } catch (error) {
      const lowerMessage = error?.message?.toLowerCase() || "";
      const message = lowerMessage.includes("already registered") || lowerMessage.includes("already been registered")
        ? "An account with this email already exists."
        : lowerMessage.includes("duplicate") || lowerMessage.includes("database error")
          ? "This email or roll number is already registered."
          : error?.message || "Registration failed. Please try again.";
      setFormError(message);
      toast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  const strength = passwordStrength(form.password);

  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <Link href="/" className="brand"><span className="brand-mark">CD</span> CampusDesk</Link>
        <div>
          <p className="auth-quote">
            One account. Every complaint you&apos;ve ever filed, and where each one stands, <span>in one place.</span>
          </p>
        </div>
        <small>Takes under a minute · No fees · Roll-number verified</small>
      </aside>

      <main className="auth-main">
        <div className="auth-card" style={{ maxWidth: 480 }}>
          <h1>Create your student account</h1>
          <p className="lede">Fill in your details exactly as they appear in college records.</p>

          {formError && <div className="form-banner error">{formError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <Field id="name" label="Full name" error={errors.name}>
                <input type="text" id="name" placeholder="Aarav Sharma" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field id="roll" label="Roll number" error={errors.roll}>
                <input type="text" id="roll" placeholder="CS21045" value={form.roll} onChange={(e) => set("roll", e.target.value)} />
              </Field>
            </div>

            <div className="form-row">
              <Field id="department" label="Department" error={errors.department}>
                <select id="department" value={form.department} onChange={(e) => set("department", e.target.value)}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field id="course" label="Course" error={errors.course}>
                <input type="text" id="course" placeholder="B.Tech CSE" value={form.course} onChange={(e) => set("course", e.target.value)} />
              </Field>
            </div>

            <Field id="semester" label="Semester" error={errors.semester}>
              <select id="semester" value={form.semester} onChange={(e) => set("semester", e.target.value)}>
                <option value="">Select semester</option>
                {SEMESTERS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>

            <Field id="email" label="Email address" error={errors.email}>
              <input type="email" id="email" placeholder="you@college.edu" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>

            <Field id="phone" label="Phone number" error={errors.phone}>
              <input
                type="tel" id="phone" maxLength={10} placeholder="10-digit mobile number"
                value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </Field>

            <Field id="password" label="Password" error={errors.password}>
              <div className="input-wrap">
                <input
                  type={showPass ? "text" : "password"} id="password" placeholder="Create a password"
                  value={form.password} onChange={(e) => set("password", e.target.value)}
                />
                <button type="button" className="toggle-pass" onClick={() => setShowPass((s) => !s)}>{showPass ? "Hide" : "Show"}</button>
              </div>
              <div className="strength-bar">
                <span style={{ width: `${(strength / 4) * 100}%`, background: strengthColor(strength) }}></span>
              </div>
              <div className="hint">{form.password ? strengthLabel(strength) : ""}</div>
            </Field>

            <Field id="confirm" label="Confirm password" error={errors.confirm}>
              <div className="input-wrap">
                <input
                  type={showConfirm ? "text" : "password"} id="confirm" placeholder="Re-enter your password"
                  value={form.confirm} onChange={(e) => set("confirm", e.target.value)}
                />
                <button type="button" className="toggle-pass" onClick={() => setShowConfirm((s) => !s)}>{showConfirm ? "Hide" : "Show"}</button>
              </div>
            </Field>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Creating account…" : "Register"}
            </button>
          </form>

          <p className="form-foot">Already registered? <Link href="/login">Log in</Link></p>
        </div>
      </main>
    </div>
  );
}
