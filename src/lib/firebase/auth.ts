import "server-only";

/**
 * Server-side auth for Firebase, cookie-session based.
 *
 * Flow: the client signs in (Google popup or email magic-link), obtains a
 * Firebase ID token, and POSTs it to /api/auth/session. There we mint a
 * long-lived **session cookie** with the Admin SDK and store it httpOnly.
 * Protected pages/actions call getCurrentUser(), which verifies that cookie.
 *
 * This replaces the old Supabase getCurrentUser()/requireUser().
 */
import { cookies } from "next/headers";
import { adminAuth } from "./admin";

export const SESSION_COOKIE = "fc_session";
// 14 days, in ms (Firebase session cookies max out at 14 days).
export const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: string; // Firebase uid
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

/** Mint a session cookie from a freshly-issued Firebase ID token. */
export async function createSessionCookie(idToken: string): Promise<string> {
  return adminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });
}

/**
 * Resolve the signed-in user from the session cookie, or null.
 * Verifies the cookie against Firebase (checks revocation).
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true);
    return {
      id: decoded.uid,
      email: decoded.email ?? null,
      name: (decoded.name as string | undefined) ?? null,
      avatarUrl: (decoded.picture as string | undefined) ?? null,
    };
  } catch {
    // Expired, revoked, or malformed cookie → treat as signed-out.
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

/** Clear the user session cookie (sign-out). */
export function clearSessionCookie(): void {
  cookies().delete(SESSION_COOKIE);
}

// Admin auth is separate (static email/password) — see src/lib/admin/session.ts.
