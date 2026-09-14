import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";
import { hashPassword, createSessionToken, setAuthCookie } from "@/lib/auth";
import { isRequired, isEmail, isPhone, passwordStrength } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, roll, department, course, semester, email, phone, password } = body;

    // Validation
    if (!isRequired(name)) {
      return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
    }
    if (!isRequired(roll)) {
      return NextResponse.json({ error: "Enter your roll number." }, { status: 400 });
    }
    if (!isRequired(department)) {
      return NextResponse.json({ error: "Select your department." }, { status: 400 });
    }
    if (!isRequired(course)) {
      return NextResponse.json({ error: "Enter your course." }, { status: 400 });
    }
    if (!isRequired(semester)) {
      return NextResponse.json({ error: "Select your semester." }, { status: 400 });
    }
    if (!isRequired(email) || !isEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!isPhone(phone)) {
      return NextResponse.json({ error: "Enter a valid 10-digit phone number." }, { status: 400 });
    }
    if (!password || passwordStrength(password) < 3 || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters, with a number and a symbol." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRoll = roll.trim().toUpperCase();

    // Check if email or roll number already exists
    const { data: existing, error: checkError } = await supabaseServer
      .from("profiles")
      .select("id, email, roll")
      .or(`email.ilike.${cleanEmail},roll.ilike.${cleanRoll}`);

    if (checkError) {
      console.error("[Register] Error checking existing user:", checkError);
      return NextResponse.json(
        { error: "Database service error. Ensure Supabase is configured and tables exist." },
        { status: 500 }
      );
    }

    if (existing && existing.length > 0) {
      const matchEmail = existing.some((u) => u.email?.toLowerCase() === cleanEmail);
      if (matchEmail) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
      }
      return NextResponse.json({ error: "This roll number is already registered." }, { status: 400 });
    }

    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(password);

    const { data: profile, error: insertError } = await supabaseServer
      .from("profiles")
      .insert({
        id: userId,
        role: "student",
        name: name.trim(),
        roll: cleanRoll,
        email: cleanEmail,
        phone: phone.trim(),
        department: department.trim(),
        course: course.trim(),
        semester: semester.trim(),
        password_hash: passwordHash,
      })
      .select("id, role, name, roll, email, phone, department, course, semester, created_at")
      .single();

    if (insertError) {
      console.error("[Register] Error creating profile in Supabase:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to create account in database." },
        { status: 500 }
      );
    }

    // Generate session token and set cookie
    const token = createSessionToken({
      id: profile.id,
      email: profile.email,
      role: profile.role,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      user: { id: profile.id, email: profile.email, role: profile.role },
      profile,
    });
  } catch (err) {
    console.error("[Register] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Something went wrong." }, { status: 500 });
  }
}
