"use server";

import { z } from "zod";
import { adminAuth } from "@/lib/firebase/admin";
import { ensureUser, upsertSubscription } from "@/lib/firestore/repo";

const SignUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;

export interface SignUpResult {
  ok: boolean;
  error?: string;
  email?: string;
}

/**
 * Self-serve sign-up. Creates a Firebase email/password account with NO
 * verification (the email is taken at face value) and provisions a FREE
 * subscription. A free account can sign in but is bounced to /upgrade — it can
 * use nothing in the app until that email is run through the /thank-you flow,
 * which flips the same uid to pro_monthly (see actions/access.ts → grantAccess).
 */
export async function signUp(input: SignUpInput): Promise<SignUpResult> {
  const parsed = SignUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const name = parsed.data.name;
  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;

  const auth = adminAuth();

  // Reject if the email already has an account (free or paid) — they should
  // sign in instead. We don't reveal which to keep enumeration low-value.
  try {
    await auth.getUserByEmail(email);
    return {
      ok: false,
      error: "An account with this email already exists. Try signing in.",
    };
  } catch {
    // No existing user — good, continue.
  }

  let uid: string;
  try {
    const created = await auth.createUser({ email, password, displayName: name });
    uid = created.uid;
  } catch (e) {
    console.error("[signUp] createUser failed:", e);
    return { ok: false, error: "Could not create your account. Try again." };
  }

  // Free account: exists, can sign in, but hasPaidAccess() === false → /upgrade.
  await ensureUser(uid, email, name);
  await upsertSubscription(uid, { tier: "free", status: "active" });

  return { ok: true, email };
}
