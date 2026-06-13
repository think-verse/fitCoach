import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSessionCookie,
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
} from "@/lib/firebase/auth";

export const runtime = "nodejs";

/**
 * POST /api/auth/session  Body: { idToken: string }
 * Exchanges a freshly-issued Firebase ID token for a long-lived session cookie.
 * Called by the client right after Google popup / email-link sign-in.
 */
export async function POST(req: Request) {
  const { idToken } = await req.json().catch(() => ({ idToken: null }));
  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }
  try {
    const cookie = await createSessionCookie(idToken);
    cookies().set(SESSION_COOKIE, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/auth/session] mint failed:", e);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

/** DELETE — sign out (clear the cookie). */
export async function DELETE() {
  cookies().delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
