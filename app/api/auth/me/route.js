import { NextResponse } from "next/server";
import { getAuthSession, clearAuthCookie } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session || !session.id) {
      return NextResponse.json({ user: null, profile: null });
    }

    const { data: profile, error } = await supabaseServer
      .from("profiles")
      .select("id, role, name, roll, email, phone, department, course, semester, created_at")
      .eq("id", session.id)
      .maybeSingle();

    if (error || !profile) {
      // Session exists for user not found in database; clean up cookie
      await clearAuthCookie();
      return NextResponse.json({ user: null, profile: null });
    }

    return NextResponse.json({
      user: { id: profile.id, email: profile.email, role: profile.role },
      profile,
    });
  } catch (err) {
    console.error("[Me] Error fetching session user:", err);
    return NextResponse.json({ user: null, profile: null });
  }
}
