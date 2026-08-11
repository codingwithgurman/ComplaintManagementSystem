"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";
import { useToast } from "@/lib/ToastProvider";
import { isRequired, isEmail } from "@/lib/validate";
import Field from "@/components/Field";

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, profile, loading } = useAuth();

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
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error) {
      setSubmitting(false);
      setFormError("Incorrect email or password.");
      toast("Incorrect email or password.", "error");
      return;
    }

    const { data: prof } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    setSubmitting(false);

    if (prof?.role !== "admin") {
      await supabase.auth.signOut();
      setFormError("This account isn't registered as an administrator.");
      toast("This account isn't registered as an administrator.", "error");
      return;
    }

    toast("Welcome back, Admin!", "success");
    router.push("/admin/dashboard");
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
          Promote an account to admin from the Supabase SQL editor — see <code>sql/02_seed_data.sql</code>.
        </p>
      </div>
    </div>
  );
}
