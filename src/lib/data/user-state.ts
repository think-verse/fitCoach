import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Server-only loaders that aggregate a single user's app state.
 * Used by dashboard, workout, diet, progress, coach pages.
 */

export async function getProfile(userId: string) {
  const [p] = await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, userId))
    .limit(1);
  return p;
}

export async function getActiveWorkoutPlan(userId: string) {
  const [plan] = await db
    .select()
    .from(schema.workoutPlans)
    .where(
      and(
        eq(schema.workoutPlans.userId, userId),
        eq(schema.workoutPlans.isActive, true),
      ),
    )
    .orderBy(desc(schema.workoutPlans.createdAt))
    .limit(1);
  if (!plan) return null;

  const days = await db
    .select()
    .from(schema.workoutDays)
    .where(eq(schema.workoutDays.planId, plan.id))
    .orderBy(schema.workoutDays.dayIndex);

  const dayIds = days.map((d) => d.id);
  const allExercises = dayIds.length
    ? await db
        .select()
        .from(schema.exercises)
        .where(sql`${schema.exercises.dayId} IN ${dayIds}`)
        .orderBy(schema.exercises.dayId, schema.exercises.orderIndex)
    : [];

  return {
    plan,
    days: days.map((d) => ({
      ...d,
      exercises: allExercises.filter((e) => e.dayId === d.id),
    })),
  };
}

export async function getActiveDietPlan(userId: string) {
  const [plan] = await db
    .select()
    .from(schema.dietPlans)
    .where(
      and(
        eq(schema.dietPlans.userId, userId),
        eq(schema.dietPlans.isActive, true),
      ),
    )
    .orderBy(desc(schema.dietPlans.createdAt))
    .limit(1);
  if (!plan) return null;

  const meals = await db
    .select()
    .from(schema.mealItems)
    .where(eq(schema.mealItems.planId, plan.id))
    .orderBy(schema.mealItems.orderIndex);

  return { plan, meals };
}

export async function getLatestAnalysis(userId: string) {
  const [r] = await db
    .select()
    .from(schema.bodyAnalysisReports)
    .where(eq(schema.bodyAnalysisReports.userId, userId))
    .orderBy(desc(schema.bodyAnalysisReports.createdAt))
    .limit(1);
  return r;
}

export async function getWeightHistory(userId: string, limit = 20) {
  return db
    .select()
    .from(schema.bodyMeasurements)
    .where(eq(schema.bodyMeasurements.userId, userId))
    .orderBy(desc(schema.bodyMeasurements.recordedAt))
    .limit(limit);
}

export async function getCheckins(userId: string) {
  return db
    .select()
    .from(schema.weeklyCheckins)
    .where(eq(schema.weeklyCheckins.userId, userId))
    .orderBy(desc(schema.weeklyCheckins.weekNumber));
}

/** Pick "today's" workout day by day-of-week mod the plan's days. */
export function pickTodaysDay<T extends { dayIndex: number }>(
  days: T[],
): T | null {
  if (days.length === 0) return null;
  const dow = new Date().getDay(); // 0–6
  // Map calendar day-of-week onto the plan's day indices: pick the day whose
  // index matches, or fall back to the closest <= dow, or the first day.
  const exact = days.find((d) => d.dayIndex === dow);
  if (exact) return exact;
  const sorted = [...days].sort((a, b) => a.dayIndex - b.dayIndex);
  const earlier = [...sorted].reverse().find((d) => d.dayIndex < dow);
  return earlier ?? sorted[0];
}
