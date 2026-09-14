"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/lib/ToastProvider";
import { isRequired, isEmail } from "@/lib/validate";
import Field from "@/components/Field";

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, profile, loading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!loading && user && profile?.role === "admin") {
      router.replace("/admin/dashboard");
    }
  }, [loading, user, profile, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!isRequired(email) || !isEmail(email)) nextErrors.email = "Enter a valid email address.";
    if (!isRequired(password)) nextErrors.password = "Enter your password.";
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await login({
        email: email.trim(),
        password,
        requiredRole: "admin",
      });

      toast("Welcome back, Admin!", "success");
      router.push("/admin/dashboard");
    } catch (error) {
      const message = error?.message || "Could not verify administrator permissions.";
      setFormError(message);
      toast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="simple-auth">
      <div className="auth-card">
        <Link href="/" className="brand" style={{ marginBottom: 24, justifyContent: "center" }}>
          <span className="brand-mark">CD</span> CampusDesk
        </Link>
        <h1 style={{ textAlign: "center" }}>Admin Login</h1>
        <p className="lede" style={{ textAlign: "center" }}>Review, update, and resolve complaints directly.</p>

        {formError && <div className="form-banner error">{formError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <Field id="email" label="Email address" error={errors.email}>
            <input type="email" id="email" placeholder="admin@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field id="password" label="Password" error={errors.password}>
            <div className="input-wrap">
              <input
                type={showPass ? "text" : "password"} id="password" placeholder="Enter your password"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="toggle-pass" onClick={() => setShowPass((s) => !s)}>{showPass ? "Hide" : "Show"}</button>
            </div>
          </Field>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="form-foot">Student? <Link href="/login">Go to student login</Link></p>
        <p className="form-foot" style={{ fontSize: ".78rem" }}>
          Register an account first, then promote its profile in the database — see <code>README.md</code>.
        </p>
      </div>
    </div>
  );
}
