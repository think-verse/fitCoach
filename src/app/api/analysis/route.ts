import { NextResponse } from "next/server";
import { requireUser } from "@/lib/firebase/auth";
import {
  getProfile,
  getProgressPhotos,
  downloadPhotoBase64,
  saveAnalysis,
} from "@/lib/firestore/repo";
import { generateBodyAnalysis } from "@/lib/ai/body-analysis";
import { AIConfigError } from "@/lib/ai/client";
import { computeNutrition } from "@/lib/calc";
import { checkGenerationAllowed } from "@/lib/limits/limits";
import { reportError, GENERIC_ERROR } from "@/lib/errors/report";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/analysis  Body: { weekNumber?: number }
 * Loads profile + latest photo of each angle for the week, downloads the bytes
 * from Storage, runs the AI body analysis, persists the structured report.
 */
export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const weekNumber: number = body?.weekNumber ?? 0;

  const profile = await getProfile(user.id);
  if (!profile?.onboardingCompleted) {
    return NextResponse.json({ error: "Profile not complete." }, { status: 400 });
  }

  // Enforce the generation cap (weekly + monthly). One generation = this whole
  // analysis→plan flow; we count it here, at the start, so retrying the plan
  // step doesn't double-count.
  const gate = await checkGenerationAllowed(user.id);
  if (!gate.allowed) {
    return NextResponse.json(
      { error: gate.reason, code: "LIMIT_REACHED", limit: gate.limit, window: gate.window },
      { status: 429 },
    );
  }

  // Latest photo of each angle for this week.
  const photoRows = await getProgressPhotos(user.id, weekNumber);
  const latestByAngle = new Map<string, (typeof photoRows)[number]>();
  for (const p of photoRows) {
    if (!latestByAngle.has(p.angle)) latestByAngle.set(p.angle, p);
  }
  if (latestByAngle.size < 3) {
    return NextResponse.json(
      { error: "Please upload front, side, and back photos first." },
      { status: 400 },
    );
  }

  const photos: Array<{
    angle: "front" | "side" | "back";
    base64: string;
    mediaType: string;
  }> = [];
  for (const angle of ["front", "side", "back"] as const) {
    const row = latestByAngle.get(angle);
    if (!row) continue;
    try {
      const { base64, mediaType } = await downloadPhotoBase64(row.storagePath);
      photos.push({ angle, base64, mediaType });
    } catch {
      return NextResponse.json(
        { error: `Could not load ${angle} photo.` },
        { status: 500 },
      );
    }
  }

  let analysis;
  try {
    analysis = await generateBodyAnalysis({ profile, photos });
  } catch (e) {
    await reportError("/api/analysis", e, {
      userId: user.id,
      code: e instanceof AIConfigError ? "AI_NOT_CONFIGURED" : null,
    });
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 502 });
  }

  const nutrition = computeNutrition({
    heightCm: Number(profile.heightCm),
    weightKg: Number(profile.weightKg),
    age: profile.age ?? 30,
    gender: profile.gender ?? "other",
    activityLevel: profile.activityLevel ?? "moderate",
    goal: profile.goal ?? "general_fitness",
  });

  const id = await saveAnalysis(user.id, {
    bmi: nutrition.bmi,
    bmiCategory: nutrition.bmiCategory,
    bmr: nutrition.bmr,
    tdee: nutrition.tdee,
    targetCalories: nutrition.targetCalories,
    proteinG: nutrition.proteinG,
    carbsG: nutrition.carbsG,
    fatG: nutrition.fatG,
    estimatedBodyFatRange: analysis.estimated_body_fat_range,
    physiqueType: analysis.physique_type,
    report: analysis,
    confidenceLevel: analysis.confidence_level,
    weekNumber,
  });

  return NextResponse.json({ id, analysis, nutrition });
}
