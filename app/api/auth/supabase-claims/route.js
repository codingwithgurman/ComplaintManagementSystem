import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(request) {
  const authorization = request.headers.get("authorization") || "";
  const idToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!idToken) {
    return NextResponse.json({ error: "A Firebase ID token is required." }, { status: 401 });
  }

  try {
    const adminAuth = getFirebaseAdminAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const user = await adminAuth.getUser(decoded.uid);

    if (user.customClaims?.role !== "authenticated") {
      await adminAuth.setCustomUserClaims(decoded.uid, {
        ...user.customClaims,
        role: "authenticated",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[CampusDesk] Firebase/Supabase claim setup failed:", error);
    const unauthorized = error?.code?.startsWith("auth/");
    return NextResponse.json(
      { error: unauthorized ? "The Firebase session is invalid or expired." : "Authentication setup is incomplete on the server." },
      { status: unauthorized ? 401 : 500 }
    );
  }
}
