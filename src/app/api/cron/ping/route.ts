import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Keep-alive / health endpoint — hit by Vercel cron on a schedule.
 * Does a trivial Firestore read to confirm the backend is reachable.
 *
 * Auth (optional but recommended): set CRON_SECRET in env; Vercel sends
 * `Authorization: Bearer <CRON_SECRET>` automatically on cron invocations.
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  try {
    await adminDb().collection("config").doc("pricing").get();
    return NextResponse.json({ ok: true, ts: new Date().toISOString() });
  } catch (e) {
    console.error("[cron/ping]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}
