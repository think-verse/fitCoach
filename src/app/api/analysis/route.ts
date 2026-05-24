import { NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import {
  createClient,
  createServiceClient,
  requireUser,
} from "@/lib/supabase/server";
import { generateBodyAnalysis } from "@/lib/ai/body-analysis";
import { AIConfigError } from "@/lib/ai/client";
import { computeNutrition } from "@/lib/calc";

const BUCKET = process.env.SUPABASE_PHOTO_BUCKET ?? "physique-photos";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/analysis
 * Body: { weekNumber?: number }
 * - Loads the user's profile + most recent set of photos for the given week
 * - Downloads photos via service client, converts to base64
 * - Runs AI body analysis
 * - Persists the structured report
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

  // 1. Profile
  const [profile] = await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, user.id))
    .limit(1);
  if (!profile?.onboardingCompleted) {
    return NextResponse.json(
      { error: "Profile not complete." },
      { status: 400 },
    );
  }

  // 2. Photos — most recent of each angle for this week.
  const photoRows = await db
    .select()
    .from(schema.progressPhotos)
    .where(
      and(
        eq(schema.progressPhotos.userId, user.id),
        eq(schema.progressPhotos.weekNumber, weekNumber),
      ),
    )
    .orderBy(desc(schema.progressPhotos.uploadedAt));

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

  // 3. Download via service client (RLS-safe, server-only key).
  const service = createServiceClient();
  const photos: Array<{
    angle: "front" | "side" | "back";
    base64: string;
    mediaType: string;
  }> = [];
  for (const angle of ["front", "side", "back"] as const) {
    const row = latestByAngle.get(angle);
    if (!row) continue;
    const { data, error } = await service.storage
      .from(BUCKET)
      .download(row.storagePath);
    if (error || !data) {
      return NextResponse.json(
        { error: `Could not load ${angle} photo.` },
        { status: 500 },
      );
    }
    const buf = Buffer.from(await data.arrayBuffer());
    const mediaType = data.type || guessMediaType(row.storagePath);
    photos.push({ angle, base64: buf.toString("base64"), mediaType });
  }

  // 4. Run AI.
  let analysis;
  try {
    analysis = await generateBodyAnalysis({ profile, photos });
  } catch (e) {
    if (e instanceof AIConfigError) {
      return NextResponse.json({ error: e.message, code: "AI_NOT_CONFIGURED" }, { status: 503 });
    }
    console.error("[/api/analysis] AI error:", e);
    return NextResponse.json(
      { error: "AI analysis failed. Please try again." },
      { status: 502 },
    );
  }

  // 5. Compute nutrition (deterministic, store alongside).
  const nutrition = computeNutrition({
    heightCm: Number(profile.heightCm),
    weightKg: Number(profile.weightKg),
    age: profile.age ?? 30,
    gender: profile.gender ?? "other",
    activityLevel: (profile.activityLevel ?? "moderate") as
      | "sedentary"
      | "light"
      | "moderate"
      | "active"
      | "very_active",
    goal: profile.goal ?? "general_fitness",
  });

  // 6. Persist.
  const [saved] = await db
    .insert(schema.bodyAnalysisReports)
    .values({
      userId: user.id,
      bmi: String(nutrition.bmi),
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
    })
    .returning();

  return NextResponse.json({ id: saved.id, analysis, nutrition });
}

function guessMediaType(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}
