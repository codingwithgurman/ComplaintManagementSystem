"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/lib/ToastProvider";
import { isRequired, isEmail } from "@/lib/validate";
import Field from "@/components/Field";

export default function LoginPage() {
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
    if (!loading && user && profile?.role === "student") {
      router.replace("/dashboard");
    }
  }, [loading, user, profile, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!isRequired(email) || !isEmail(email)) nextErrors.email = "Enter a valid email address.";
    if (!isRequired(password)) nextErrors.password = "Password is required.";
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      toast("Welcome back!", "success");
      router.push("/dashboard");
    } catch (error) {
      const message = error?.message || "Incorrect email or password.";
      setFormError(message);
      toast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <Link href="/" className="brand"><span className="brand-mark">CD</span> CampusDesk</Link>
        <div>
          <p className="auth-quote">
            &quot;Filed a Wi-Fi complaint <span>Monday</span>, resolved by <span>Wednesday</span>. Never had to ask twice.&quot;
          </p>
          <small>— B.Tech CSE, 3rd year</small>
        </div>
        <small>Real-time status · Department accountability · AI help desk</small>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="lede">Log in to file a new complaint or track an existing one.</p>

          {formError && <div className="form-banner error">{formError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <Field id="email" label="Email address" error={errors.email}>
              <input
                type="email" id="email" autoComplete="username" placeholder="you@college.edu"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field id="password" label="Password" error={errors.password}>
              <div className="input-wrap">
                <input
                  type={showPass ? "text" : "password"} id="password" autoComplete="current-password"
                  placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="toggle-pass" onClick={() => setShowPass((s) => !s)}>
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </Field>

            <div className="check-row">
              <span>Your session stays signed in securely.</span>
              <Link href="/register">New here?</Link>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="form-foot">New here? <Link href="/register">Create an account</Link></p>
          <p className="form-foot" style={{ marginTop: 6 }}>Admin? <Link href="/admin/login">Go to admin login</Link></p>
        </div>
      </main>
    </div>
  );
}
