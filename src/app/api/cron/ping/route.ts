import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Keep-alive endpoint — hit by Vercel cron on a schedule.
 *
 * Does a 1-row SELECT against Supabase to:
 *   1. Reset Supabase's free-tier auto-pause timer (kicks in after ~1 week idle)
 *   2. Keep the Postgres connection + auth backend warm so first user requests
 *      after idle don't cold-start
 *
 * Auth is optional but recommended in production:
 *   - Set CRON_SECRET in Vercel env vars (any random string)
 *   - Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` on cron
 *   - Without CRON_SECRET set, the endpoint is open (still harmless — only does
 *     a SELECT 1)
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
    await db.execute(sql`select 1`);
    return NextResponse.json({
      ok: true,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[cron/ping]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}
