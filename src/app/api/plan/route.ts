import { NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/supabase/server";
import { generateWorkoutPlan } from "@/lib/ai/workout-plan";
import { generateDietPlan } from "@/lib/ai/diet-plan";
import { AIConfigError } from "@/lib/ai/client";
import { computeNutrition } from "@/lib/calc";
import type { BodyAnalysis } from "@/lib/ai/schemas";

export const runtime = "nodejs";
// 60s is the Vercel Hobby ceiling. Plan gen now runs ~16s so this is ample.
export const maxDuration = 60;

/**
 * POST /api/plan
 * Body: { analysisId: string }
 * Generates workout + diet plan in parallel, persists, marks any old plan
 * inactive. Returns workoutPlanId + dietPlanId.
 */
export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const analysisId: string | undefined = body?.analysisId;

  // 1. Profile + analysis
  const [profile] = await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, user.id))
    .limit(1);
  if (!profile) {
    return NextResponse.json({ error: "Complete onboarding first." }, { status: 400 });
  }

  let analysisRow;
  if (analysisId) {
    [analysisRow] = await db
      .select()
      .from(schema.bodyAnalysisReports)
      .where(
        and(
          eq(schema.bodyAnalysisReports.id, analysisId),
          eq(schema.bodyAnalysisReports.userId, user.id),
        ),
      )
      .limit(1);
  } else {
    [analysisRow] = await db
      .select()
      .from(schema.bodyAnalysisReports)
      .where(eq(schema.bodyAnalysisReports.userId, user.id))
      .orderBy(desc(schema.bodyAnalysisReports.createdAt))
      .limit(1);
  }
  if (!analysisRow) {
    return NextResponse.json(
      { error: "Run a body analysis first." },
      { status: 400 },
    );
  }
  const analysis = analysisRow.report as BodyAnalysis;

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

  // 2. Generate workout + diet in parallel.
  let workoutPlan, dietPlan;
  try {
    [workoutPlan, dietPlan] = await Promise.all([
      generateWorkoutPlan({ profile, analysis }),
      generateDietPlan({
        profile,
        calorieTargets: {
          targetCalories: nutrition.targetCalories,
          proteinG: nutrition.proteinG,
          carbsG: nutrition.carbsG,
          fatG: nutrition.fatG,
          waterMl: nutrition.waterMl,
        },
      }),
    ]);
  } catch (e) {
    if (e instanceof AIConfigError) {
      return NextResponse.json(
        { error: e.message, code: "AI_NOT_CONFIGURED" },
        { status: 503 },
      );
    }
    console.error("[/api/plan] AI error:", e);
    return NextResponse.json(
      { error: "Plan generation failed. Please try again." },
      { status: 502 },
    );
  }

  // 3. Mark old plans inactive.
  await db
    .update(schema.workoutPlans)
    .set({ isActive: false })
    .where(eq(schema.workoutPlans.userId, user.id));
  await db
    .update(schema.dietPlans)
    .set({ isActive: false })
    .where(eq(schema.dietPlans.userId, user.id));

  // 4. Insert workout plan + days + exercises in a single transaction.
  const [savedPlan] = await db
    .insert(schema.workoutPlans)
    .values({
      userId: user.id,
      splitName: workoutPlan.split_name,
      daysPerWeek: workoutPlan.days_per_week,
      notes: workoutPlan.notes,
      isActive: true,
    })
    .returning();

  for (const day of workoutPlan.days) {
    const [savedDay] = await db
      .insert(schema.workoutDays)
      .values({
        planId: savedPlan.id,
        dayIndex: day.day_index,
        title: day.title,
        focus: day.focus,
        warmup: day.warmup,
        cooldown: day.cooldown,
        cardio: day.cardio,
      })
      .returning();
    if (day.exercises.length > 0) {
      await db.insert(schema.exercises).values(
        day.exercises.map((ex, i) => ({
          dayId: savedDay.id,
          orderIndex: i,
          name: ex.name,
          targetMuscle: ex.target_muscle,
          sets: ex.sets,
          reps: ex.reps,
          restSeconds: ex.rest_seconds,
          rpe: ex.rpe,
          tempo: ex.tempo,
          formCues: ex.form_cues,
          commonMistakes: ex.common_mistakes,
          demoVideoUrl: ex.demo_video_url || null,
          alternativeExercise: ex.alternative_exercise,
          progressionRule: ex.progression_rule,
        })),
      );
    }
  }

  // 5. Insert diet plan + meals.
  const [savedDiet] = await db
    .insert(schema.dietPlans)
    .values({
      userId: user.id,
      targetCalories: dietPlan.target_calories,
      proteinG: dietPlan.protein_g,
      carbsG: dietPlan.carbs_g,
      fatG: dietPlan.fat_g,
      waterMl: dietPlan.water_ml,
      notes: dietPlan.notes,
      groceryList: dietPlan.grocery_list,
      isActive: true,
    })
    .returning();

  if (dietPlan.meals.length > 0) {
    await db.insert(schema.mealItems).values(
      dietPlan.meals.map((m, i) => ({
        planId: savedDiet.id,
        mealType: m.meal_type,
        orderIndex: i,
        name: m.name,
        description: m.description,
        calories: m.calories,
        proteinG: m.protein_g,
        carbsG: m.carbs_g,
        fatG: m.fat_g,
        alternatives: m.alternatives,
      })),
    );
  }

  return NextResponse.json({
    workoutPlanId: savedPlan.id,
    dietPlanId: savedDiet.id,
  });
}
