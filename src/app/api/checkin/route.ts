import { NextResponse } from "next/server";
import { requireUser } from "@/lib/firebase/auth";
import {
  getProfile,
  getLatestAnalysis,
  getCheckinByWeek,
  getProgressPhotos,
  getWeightHistory,
  downloadPhotoBase64,
  updateCheckinSummary,
} from "@/lib/firestore/repo";
import { generateWeeklyUpdate } from "@/lib/ai/weekly-update";
import { AIConfigError } from "@/lib/ai/client";
import type { BodyAnalysis } from "@/lib/ai/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/checkin  Body: { weekNumber: number }
 * Compares this week's data to the baseline analysis → WeeklyUpdate, persisted
 * onto the check-in doc's summary.
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

  const profile = await getProfile(user.id);
  if (!profile) {
    return NextResponse.json({ error: "Onboarding incomplete." }, { status: 400 });
  }

  const baseline = await getLatestAnalysis(user.id);
  if (!baseline) {
    return NextResponse.json({ error: "Run a body analysis first." }, { status: 400 });
  }

  const checkin = await getCheckinByWeek(user.id, weekNumber);
  if (!checkin) {
    return NextResponse.json({ error: "Save your check-in first." }, { status: 400 });
  }

  // Photo pairs: baseline week 0 vs current week, when both complete sets exist.
  const baselinePhotos = await getProgressPhotos(user.id, 0);
  const currentPhotos = await getProgressPhotos(user.id, weekNumber);
  const baselineByAngle = new Map<string, (typeof baselinePhotos)[number]>();
  const currentByAngle = new Map<string, (typeof currentPhotos)[number]>();
  for (const p of baselinePhotos)
    if (!baselineByAngle.has(p.angle)) baselineByAngle.set(p.angle, p);
  for (const p of currentPhotos)
    if (!currentByAngle.has(p.angle)) currentByAngle.set(p.angle, p);

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
        try {
          const { base64, mediaType } = await downloadPhotoBase64(row.storagePath);
          photoPairs.push({ label, base64, mediaType });
        } catch {
          /* skip unreadable photo */
        }
      }
    }
  }

  // Previous weight = the measurement before the current check-in's snapshot.
  const weights = await getWeightHistory(user.id, 5);
  const prevWeight = weights[1]?.weightKg ?? undefined;

  let update;
  try {
    update = await generateWeeklyUpdate({
      profile,
      previous: {
        weightKg: prevWeight ?? undefined,
        weekNumber: baseline.weekNumber ?? 0,
        analysis: baseline.report as BodyAnalysis,
      },
      current: {
        weightKg: checkin.weightKg ?? undefined,
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
    return NextResponse.json({ error: "Weekly comparison failed." }, { status: 502 });
  }

  const consistency = Math.round(
    ((checkin.adherenceWorkoutPct ?? 0) + (checkin.adherenceDietPct ?? 0)) / 2,
  );
  await updateCheckinSummary(user.id, checkin.id, update, consistency);

  return NextResponse.json({ update });
}
