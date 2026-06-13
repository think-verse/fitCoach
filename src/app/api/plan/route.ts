import { NextResponse } from "next/server";
import { requireUser } from "@/lib/firebase/auth";
import {
  getProfile,
  getLatestAnalysis,
  getAnalysisById,
  saveWorkoutPlan,
  saveDietPlan,
} from "@/lib/firestore/repo";
import { generateWorkoutPlan } from "@/lib/ai/workout-plan";
import { generateDietPlan } from "@/lib/ai/diet-plan";
import { AIConfigError } from "@/lib/ai/client";
import { reportError, GENERIC_ERROR } from "@/lib/errors/report";
import { computeNutrition } from "@/lib/calc";
import type { BodyAnalysis } from "@/lib/ai/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/plan  Body: { analysisId?: string }
 * Generates workout + diet plan in parallel, persists both, marks old plans
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

  const profile = await getProfile(user.id);
  if (!profile) {
    return NextResponse.json({ error: "Complete onboarding first." }, { status: 400 });
  }

  const analysisRow = analysisId
    ? await getAnalysisById(user.id, analysisId)
    : await getLatestAnalysis(user.id);
  if (!analysisRow) {
    return NextResponse.json({ error: "Run a body analysis first." }, { status: 400 });
  }
  const analysis = analysisRow.report as BodyAnalysis;

  const nutrition = computeNutrition({
    heightCm: Number(profile.heightCm),
    weightKg: Number(profile.weightKg),
    age: profile.age ?? 30,
    gender: profile.gender ?? "other",
    activityLevel: profile.activityLevel ?? "moderate",
    goal: profile.goal ?? "general_fitness",
  });

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
    await reportError("/api/plan", e, {
      userId: user.id,
      code: e instanceof AIConfigError ? "AI_NOT_CONFIGURED" : null,
    });
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 502 });
  }

  const workoutPlanId = await saveWorkoutPlan(user.id, {
    splitName: workoutPlan.split_name,
    daysPerWeek: workoutPlan.days_per_week,
    notes: workoutPlan.notes ?? null,
    days: workoutPlan.days.map((day) => ({
      dayIndex: day.day_index,
      title: day.title,
      focus: day.focus ?? null,
      warmup: day.warmup ?? null,
      cooldown: day.cooldown ?? null,
      cardio: day.cardio ?? null,
      exercises: day.exercises.map((ex, i) => ({
        orderIndex: i,
        name: ex.name,
        targetMuscle: ex.target_muscle ?? null,
        sets: ex.sets ?? null,
        reps: ex.reps ?? null,
        restSeconds: ex.rest_seconds ?? null,
        rpe: ex.rpe ?? null,
        tempo: ex.tempo ?? null,
        formCues: ex.form_cues ?? [],
        commonMistakes: ex.common_mistakes ?? [],
        demoVideoUrl: ex.demo_video_url || null,
        alternativeExercise: ex.alternative_exercise ?? null,
        progressionRule: ex.progression_rule ?? null,
      })),
    })),
  });

  const dietPlanId = await saveDietPlan(user.id, {
    targetCalories: dietPlan.target_calories,
    proteinG: dietPlan.protein_g,
    carbsG: dietPlan.carbs_g,
    fatG: dietPlan.fat_g,
    waterMl: dietPlan.water_ml ?? null,
    notes: dietPlan.notes ?? null,
    groceryList: dietPlan.grocery_list ?? [],
    meals: dietPlan.meals.map((m, i) => ({
      mealType: m.meal_type,
      orderIndex: i,
      name: m.name,
      description: m.description ?? null,
      calories: m.calories ?? null,
      proteinG: m.protein_g ?? null,
      carbsG: m.carbs_g ?? null,
      fatG: m.fat_g ?? null,
      alternatives: m.alternatives ?? [],
    })),
  });

  return NextResponse.json({ workoutPlanId, dietPlanId });
}
