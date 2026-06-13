import "server-only";

/**
 * Admin authentication — a SINGLE admin who signs in with a static
 * email + password kept in env (ADMIN_EMAIL / ADMIN_PASSWORD). This is
 * deliberately separate from Firebase user auth.
 *
 * On success we set a signed, httpOnly cookie. The signature (HMAC over a
 * constant payload with ADMIN_SESSION_SECRET) means the cookie can't be forged
 * without the secret.
 */
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "fc_admin";
const ADMIN_MAX_AGE_S = 12 * 60 * 60; // 12 hours

function sign(value: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  return createHmac("sha256", secret).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Validate the submitted credentials against env. */
export function checkAdminCredentials(email: string, password: string): boolean {
  const e = process.env.ADMIN_EMAIL;
  const p = process.env.ADMIN_PASSWORD;
  if (!e || !p || !process.env.ADMIN_SESSION_SECRET) return false;
  return safeEqual(email.trim().toLowerCase(), e.trim().toLowerCase()) &&
    safeEqual(password, p);
}

const PAYLOAD = "admin:v1";

export function setAdminCookie(): void {
  cookies().set(ADMIN_COOKIE, `${PAYLOAD}.${sign(PAYLOAD)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_MAX_AGE_S,
  });
}

export function clearAdminCookie(): void {
  cookies().delete(ADMIN_COOKIE);
}

/** True if the request carries a valid admin cookie. */
export function isAdminAuthed(): boolean {
  const raw = cookies().get(ADMIN_COOKIE)?.value;
  if (!raw) return false;
  const [payload, sig] = raw.split(".");
  if (payload !== PAYLOAD || !sig) return false;
  return safeEqual(sig, sign(PAYLOAD));
}

export function requireAdmin(): void {
  if (!isAdminAuthed()) throw new Error("FORBIDDEN");
}
