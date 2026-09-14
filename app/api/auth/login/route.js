import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { verifyPassword, createSessionToken, setAuthCookie } from "@/lib/auth";
import { isRequired, isEmail } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, requiredRole } = body;

    if (!isRequired(email) || !isEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!isRequired(password)) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query profile from Supabase
    const { data: profile, error } = await supabaseServer
      .from("profiles")
      .select("*")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (error) {
      console.error("[Login] Database query error:", error);
      return NextResponse.json(
        { error: "Could not connect to database. Ensure Supabase is reachable." },
        { status: 500 }
      );
    }

    if (!profile || !profile.password_hash) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    const isValid = verifyPassword(password, profile.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    // Role check if required
    if (requiredRole && profile.role !== requiredRole) {
      if (requiredRole === "admin") {
        return NextResponse.json(
          { error: "This account isn't registered as an administrator." },
          { status: 403 }
        );
      }
    }

    // Generate token and set HTTP-only cookie
    const token = createSessionToken({
      id: profile.id,
      email: profile.email,
      role: profile.role,
    });
    await setAuthCookie(token);

    // Strip password_hash before returning
    const safeProfile = { ...profile };
    delete safeProfile.password_hash;

    return NextResponse.json({
      user: { id: profile.id, email: profile.email, role: profile.role },
      profile: safeProfile,
    });
  } catch (err) {
    console.error("[Login] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Something went wrong." }, { status: 500 });
  }
}
