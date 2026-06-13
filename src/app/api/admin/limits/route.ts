import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/session";
import { setLimitsConfig, setUserLimits } from "@/lib/firestore/repo";
import type { LimitsConfig, UserLimits } from "@/lib/firestore/types";

export const runtime = "nodejs";

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * POST /api/admin/limits
 *  - Global config:   { scope: "global", config: LimitsConfig }
 *  - Per-user override: { scope: "user", uid: string, limits: UserLimits }
 *    (a null field on a per-user limit clears the override → falls back to global)
 */
export async function POST(req: Request) {
  try {
    requireAdmin();
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw e;
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ---- per-user override ----
  if (body.scope === "user") {
    const uid = typeof body.uid === "string" ? body.uid.trim() : "";
    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }
    const raw = (body.limits ?? {}) as Record<string, unknown>;
    const limits: UserLimits = {
      generationsPerWeek: num(raw.generationsPerWeek),
      generationsPerMonth: num(raw.generationsPerMonth),
      coachMessagesPerDay: num(raw.coachMessagesPerDay),
    };
    try {
      await setUserLimits(uid, limits);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Failed to save" },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  }

  // ---- global config ----
  const raw = (body.config ?? {}) as Record<string, unknown>;
  const gw = num(raw.generationsPerWeek);
  const gm = num(raw.generationsPerMonth);
  const cd = num(raw.coachMessagesPerDay);
  const cg = num(raw.costPerGenerationUsd);
  const cc = num(raw.costPerCoachMessageUsd);
  if (gw === null || gm === null || cd === null || cg === null || cc === null) {
    return NextResponse.json(
      { error: "All fields are required and must be non-negative numbers." },
      { status: 400 },
    );
  }

  const config: LimitsConfig = {
    generationsPerWeek: gw,
    generationsPerMonth: gm,
    coachMessagesPerDay: cd,
    costPerGenerationUsd: cg,
    costPerCoachMessageUsd: cc,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setLimitsConfig(config);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
