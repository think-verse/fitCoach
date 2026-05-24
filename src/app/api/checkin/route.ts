import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import {
  createServiceClient,
  requireUser,
} from "@/lib/supabase/server";
import { generateWeeklyUpdate } from "@/lib/ai/weekly-update";
import { AIConfigError } from "@/lib/ai/client";
import type { BodyAnalysis } from "@/lib/ai/schemas";

const BUCKET = process.env.SUPABASE_PHOTO_BUCKET ?? "physique-photos";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/checkin
 * Body: { weekNumber: number }
 * Compares this week's data to the most recent analysis and produces a
 * WeeklyUpdate, persisted onto weekly_checkins.summary.
 */
export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const weekNumber = Number(body?.weekNumber ?? 0);
  if (!weekNumber) {
    return NextResponse.json({ error: "weekNumber required" }, { status: 400 });
  }

  const [profile] = await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, user.id))
    .limit(1);
  if (!profile) {
    return NextResponse.json({ error: "Onboarding incomplete." }, { status: 400 });
  }

  // Last analysis (baseline)
  const [baseline] = await db
    .select()
    .from(schema.bodyAnalysisReports)
    .where(eq(schema.bodyAnalysisReports.userId, user.id))
    .orderBy(desc(schema.bodyAnalysisReports.createdAt))
    .limit(1);
  if (!baseline) {
    return NextResponse.json(
      { error: "Run a body analysis first." },
      { status: 400 },
    );
  }

  // Latest check-in row + measurements
  const [checkin] = await db
    .select()
    .from(schema.weeklyCheckins)
    .where(
      and(
        eq(schema.weeklyCheckins.userId, user.id),
        eq(schema.weeklyCheckins.weekNumber, weekNumber),
      ),
    )
    .limit(1);
  if (!checkin) {
    return NextResponse.json(
      { error: "Save your check-in first." },
      { status: 400 },
    );
  }

  // Load photo pairs (baseline week 0 vs current week) if both exist.
  const allPhotos = await db
    .select()
    .from(schema.progressPhotos)
    .where(eq(schema.progressPhotos.userId, user.id));

  const baselineByAngle = new Map<string, (typeof allPhotos)[number]>();
  const currentByAngle = new Map<string, (typeof allPhotos)[number]>();
  for (const p of allPhotos) {
    if (p.weekNumber === 0 && !baselineByAngle.has(p.angle))
      baselineByAngle.set(p.angle, p);
    if (p.weekNumber === weekNumber && !currentByAngle.has(p.angle))
      currentByAngle.set(p.angle, p);
  }

  const service = createServiceClient();
  const photoPairs: Array<{ label: string; base64: string; mediaType: string }> = [];
  if (currentByAngle.size === baselineByAngle.size && currentByAngle.size > 0) {
    for (const angle of ["front", "side", "back"] as const) {
      const prev = baselineByAngle.get(angle);
      const curr = currentByAngle.get(angle);
      if (!prev || !curr) continue;
      for (const [label, row] of [
        [`Previous ${angle}`, prev],
        [`Current ${angle}`, curr],
      ] as const) {
        const { data, error } = await service.storage
          .from(BUCKET)
          .download(row.storagePath);
        if (error || !data) continue;
        const buf = Buffer.from(await data.arrayBuffer());
        photoPairs.push({
          label,
          base64: buf.toString("base64"),
          mediaType: data.type || "image/jpeg",
        });
      }
    }
  }

  // Most recent body_measurements row BEFORE the current check-in (the "previous" weight).
  const [prevMeasurement] = await db
    .select()
    .from(schema.bodyMeasurements)
    .where(eq(schema.bodyMeasurements.userId, user.id))
    .orderBy(desc(schema.bodyMeasurements.recordedAt))
    .offset(1)
    .limit(1);

  let update;
  try {
    update = await generateWeeklyUpdate({
      profile,
      previous: {
        weightKg: prevMeasurement?.weightKg ? Number(prevMeasurement.weightKg) : undefined,
        weekNumber: baseline.weekNumber ?? 0,
        analysis: baseline.report as BodyAnalysis,
      },
      current: {
        weightKg: checkin.weightKg ? Number(checkin.weightKg) : undefined,
        weekNumber,
        photosAvailable: photoPairs.length > 0,
        workoutAdherencePct: checkin.adherenceWorkoutPct ?? 0,
        dietAdherencePct: checkin.adherenceDietPct ?? 0,
      },
      photos: photoPairs.length > 0 ? photoPairs : undefined,
    });
  } catch (e) {
    if (e instanceof AIConfigError) {
      return NextResponse.json(
        { error: e.message, code: "AI_NOT_CONFIGURED" },
        { status: 503 },
      );
    }
    console.error("[/api/checkin] AI error:", e);
    return NextResponse.json(
      { error: "Weekly comparison failed." },
      { status: 502 },
    );
  }

  // Save summary + a rough consistency score.
  const consistency = Math.round(
    ((checkin.adherenceWorkoutPct ?? 0) + (checkin.adherenceDietPct ?? 0)) / 2,
  );
  await db
    .update(schema.weeklyCheckins)
    .set({ summary: update, consistencyScore: consistency })
    .where(eq(schema.weeklyCheckins.id, checkin.id));

  return NextResponse.json({ update });
}
