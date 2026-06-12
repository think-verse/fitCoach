import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/systemeio?tier=<tier>
 *
 * Fired by systeme.io when a sale completes. Creates the buyer's account in
 * Supabase (which fires the auth trigger to insert public.users) and sets
 * their subscription tier. Supabase sends them an invite email with a
 * magic-link to set foot in the app.
 *
 * Configure in systeme.io:
 *   - URL:    https://<your-app>.vercel.app/api/webhooks/systemeio?tier=lifetime
 *   - Header: X-Webhook-Secret: <SYSTEMEIO_WEBHOOK_SECRET>
 *   - One automation per product (each with its own tier query param)
 *
 * The handler is intentionally lenient about the payload shape (systeme.io
 * payloads vary by event). We hunt for the email in a few likely places.
 */

const TIERS = ["pro_monthly", "pro_yearly", "lifetime"] as const;
type Tier = (typeof TIERS)[number];

const SUPPORTED_TIERS = new Set<string>(TIERS);

const EmailSchema = z.string().email().max(254);

export async function POST(req: Request) {
  const url = new URL(req.url);

  // 1. Secret check (if set in env). Accept either:
  //    - `X-Webhook-Secret` header (preferred — keeps the URL clean)
  //    - `?secret=...` query param (fallback for funnel platforms that don't
  //      let you set custom headers — e.g. some systeme.io plans)
  const expected = process.env.SYSTEMEIO_WEBHOOK_SECRET;
  if (expected) {
    const got =
      req.headers.get("x-webhook-secret") ??
      url.searchParams.get("secret");
    if (got !== expected) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  // 2. Tier from URL.
  const tier = (url.searchParams.get("tier") ?? "pro_monthly").toLowerCase();
  if (!SUPPORTED_TIERS.has(tier)) {
    return NextResponse.json(
      { ok: false, error: `Unsupported tier "${tier}".` },
      { status: 400 },
    );
  }

  // 3. Extract email from a payload that may take several shapes.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON." },
      { status: 400 },
    );
  }

  const email = pickEmail(body);
  if (!email) {
    return NextResponse.json(
      { ok: false, error: "No customer email found in payload." },
      { status: 400 },
    );
  }
  const parsedEmail = EmailSchema.safeParse(email);
  if (!parsedEmail.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid email." },
      { status: 400 },
    );
  }

  // 4. Ensure the user exists in Supabase auth. inviteUserByEmail creates the
  //    auth.users row AND sends a magic-link invite email (Supabase built-in).
  //    If the user already exists (e.g. they signed in via Google previously),
  //    we just upgrade their subscription — no second email needed.
  const admin = createServiceClient();
  const inviteRedirect = `${siteUrl(req)}/auth/callback?next=/dashboard`;
  let userId: string | null = null;
  let invitedNewUser = false;

  const { data: invited, error: inviteErr } = await admin.auth.admin
    .inviteUserByEmail(parsedEmail.data, {
      redirectTo: inviteRedirect,
      data: { source: "systemeio", tier },
    })
    .catch((e) => ({ data: null, error: e as Error }));

  if (invited?.user) {
    userId = invited.user.id;
    invitedNewUser = true;
  } else {
    // Most likely: "User already registered" — look them up by email.
    const lookup = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const existing = lookup.data?.users?.find(
      (u) => u.email?.toLowerCase() === parsedEmail.data.toLowerCase(),
    );
    if (existing) userId = existing.id;
    if (!userId) {
      console.error("[webhooks/systemeio] could not resolve user:", inviteErr);
      return NextResponse.json(
        { ok: false, error: "Could not create or find user." },
        { status: 500 },
      );
    }
  }

  // 5. Upsert subscription tier. Idempotent — safe to receive the same webhook
  //    twice (systeme.io retries on 5xx).
  await db
    .insert(schema.subscriptions)
    .values({
      userId,
      tier: tier as Tier,
      status: "active",
    })
    .onConflictDoUpdate({
      target: schema.subscriptions.userId,
      set: {
        tier: tier as Tier,
        status: "active",
        updatedAt: sql`now()`,
      },
    });

  return NextResponse.json({
    ok: true,
    userId,
    tier,
    invited: invitedNewUser,
  });
}

/** Find a customer email in several likely systeme.io payload shapes. */
function pickEmail(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const b = body as Record<string, unknown>;

  // Direct top-level
  if (typeof b.email === "string") return b.email;

  // Common nested shapes
  const candidates: unknown[] = [
    (b.contact as Record<string, unknown> | undefined)?.email,
    (b.customer as Record<string, unknown> | undefined)?.email,
    ((b.data as Record<string, unknown> | undefined)?.contact as
      | Record<string, unknown>
      | undefined)?.email,
    ((b.data as Record<string, unknown> | undefined)?.customer as
      | Record<string, unknown>
      | undefined)?.email,
    ((b.data as Record<string, unknown> | undefined)?.email),
  ];
  for (const c of candidates) {
    if (typeof c === "string") return c;
  }
  return undefined;
}

function siteUrl(req: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  // Fallback: derive from the request URL (works on Vercel where APP_URL is
  // intentionally unset so we use the real domain).
  return new URL(req.url).origin;
}

// Also allow GET for a quick health check (returns the configured tiers).
export async function GET() {
  return NextResponse.json({
    ok: true,
    accepts: Array.from(SUPPORTED_TIERS),
    secured: Boolean(process.env.SYSTEMEIO_WEBHOOK_SECRET),
  });
}
