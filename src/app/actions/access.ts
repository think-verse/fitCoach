"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase/admin";
import {
  ensureUser,
  upsertSubscription,
  recordPaidMember,
} from "@/lib/firestore/repo";
import {
  sendEmail,
  credentialEmailHtml,
  adminNotifyHtml,
  ADMIN_NOTIFY_EMAIL,
} from "@/lib/email/resend";

const GrantSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email"),
  mobile: z.string().trim().max(30).optional().default(""),
});

export type GrantInput = z.infer<typeof GrantSchema>;

export interface GrantResult {
  ok: boolean;
  error?: string;
  returning?: boolean;
  /** Credentials returned so the user can see them on-screen (also emailed). */
  email?: string;
  password?: string;
  loginUrl?: string;
}

/** Generate a readable, strong temporary password. */
function generatePassword(): string {
  return randomBytes(9).toString("base64url"); // ~12 url-safe chars
}

/**
 * Grant (or re-grant) paid access for an email captured on the thank-you page.
 *
 * Idempotent by email:
 *  - new email  → create a Firebase email/password user
 *  - returning  → keep the SAME uid (so all their data persists), just reset
 *                 the password and re-activate the subscription.
 * Then emails the user their credentials and notifies the admin inbox.
 */
export async function grantAccess(input: GrantInput): Promise<GrantResult> {
  const parsed = GrantSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const name = parsed.data.name;
  const email = parsed.data.email.toLowerCase();
  const mobile = parsed.data.mobile;
  const password = generatePassword();

  const auth = adminAuth();
  let uid: string;
  let returning = false;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    returning = true;
    await auth.updateUser(uid, { password, displayName: name });
  } catch {
    try {
      const created = await auth.createUser({ email, password, displayName: name });
      uid = created.uid;
    } catch (e) {
      console.error("[grantAccess] createUser failed:", e);
      return { ok: false, error: "Could not create your account. Try again." };
    }
  }

  // Same uid on repeat → existing Firestore data is preserved.
  await ensureUser(uid, email, name);
  await upsertSubscription(uid, { tier: "pro_monthly", status: "active" });
  await recordPaidMember({ uid, name, email, mobile });

  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  const loginUrl = `${base}/login`;

  // Fire emails (best-effort — access is already granted regardless).
  await Promise.allSettled([
    sendEmail({
      to: email,
      subject: "Your AesthetixAI access is confirmed 🎉",
      html: credentialEmailHtml({ name, email, password, loginUrl }),
    }),
    sendEmail({
      to: ADMIN_NOTIFY_EMAIL,
      subject: `New paid member: ${name}`,
      html: adminNotifyHtml({ name, email, mobile, loginUrl }),
    }),
  ]);

  return { ok: true, returning, email, password, loginUrl };
}
