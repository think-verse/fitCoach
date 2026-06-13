import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/session";
import { setPricing } from "@/lib/firestore/repo";
import type { PricingConfig, PricingTier } from "@/lib/firestore/types";

export const runtime = "nodejs";

const INTERVALS = new Set(["month", "year", "one_time"]);

function isValidTier(t: unknown): t is PricingTier {
  if (typeof t !== "object" || t === null) return false;
  const o = t as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.priceLabel === "string" &&
    typeof o.amount === "number" &&
    Number.isFinite(o.amount) &&
    typeof o.currency === "string" &&
    typeof o.interval === "string" &&
    INTERVALS.has(o.interval) &&
    Array.isArray(o.features) &&
    o.features.every((f) => typeof f === "string") &&
    typeof o.highlighted === "boolean" &&
    typeof o.active === "boolean"
  );
}

export async function POST(req: Request) {
  try {
    requireAdmin();
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw e;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tiers = (body as { tiers?: unknown })?.tiers;
  if (!Array.isArray(tiers) || !tiers.every(isValidTier)) {
    return NextResponse.json(
      { error: "Invalid pricing config — check tier fields" },
      { status: 400 },
    );
  }

  const config: PricingConfig = {
    tiers: tiers as PricingTier[],
    updatedAt: new Date().toISOString(),
  };

  try {
    await setPricing(config);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
