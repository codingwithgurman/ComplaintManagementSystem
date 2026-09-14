import { NextResponse } from "next/server";
import { getAuthSession, hashPassword, verifyPassword } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";
import { isRequired, passwordStrength } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const session = await getAuthSession();

    if (!session || !session.id) {
      return NextResponse.json({ error: "You must be signed in to change your password." }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!isRequired(currentPassword)) {
      return NextResponse.json({ error: "Current password is required." }, { status: 400 });
    }
    if (!isRequired(newPassword) || passwordStrength(newPassword) < 3 || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters, with a number and a symbol." },
        { status: 400 }
      );
    }

    // Fetch user's current password hash
    const { data: profile, error: fetchError } = await supabaseServer
      .from("profiles")
      .select("password_hash")
      .eq("id", session.id)
      .maybeSingle();

    if (fetchError || !profile) {
      return NextResponse.json({ error: "Could not locate user account." }, { status: 404 });
    }

    const matches = verifyPassword(currentPassword, profile.password_hash);
    if (!matches) {
      return NextResponse.json({ error: "Incorrect current password." }, { status: 400 });
    }

    const newHash = hashPassword(newPassword);

    const { error: updateError } = await supabaseServer
      .from("profiles")
      .update({ password_hash: newHash })
      .eq("id", session.id);

    if (updateError) {
      console.error("[ChangePassword] Error updating password:", updateError);
      return NextResponse.json({ error: "Could not update password in database." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("[ChangePassword] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Something went wrong." }, { status: 500 });
  }
}
