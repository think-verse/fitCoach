"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/supabase/server";
import { eq, max } from "drizzle-orm";
import { CheckinSchema, type CheckinInput } from "@/lib/validation/schemas";

/** Compute the next week number for this user (max + 1). */
export async function getNextWeekNumber(): Promise<number> {
  const user = await requireUser();
  const [row] = await db
    .select({ m: max(schema.weeklyCheckins.weekNumber) })
    .from(schema.weeklyCheckins)
    .where(eq(schema.weeklyCheckins.userId, user.id));
  const max_ = row?.m ?? 0;
  return Math.max(1, (max_ ?? 0) + 1);
}

export async function saveCheckin(input: CheckinInput, weekNumber?: number) {
  const user = await requireUser();
  const data = CheckinSchema.parse(input);
  const week = weekNumber ?? (await getNextWeekNumber());

  // Save measurement snapshot.
  await db.insert(schema.bodyMeasurements).values({
    userId: user.id,
    weightKg: data.weightKg != null ? String(data.weightKg) : null,
    waistCm: data.waistCm != null ? String(data.waistCm) : null,
    chestCm: data.chestCm != null ? String(data.chestCm) : null,
    armsCm: data.armsCm != null ? String(data.armsCm) : null,
    thighsCm: data.thighsCm != null ? String(data.thighsCm) : null,
    hipsCm: data.hipsCm != null ? String(data.hipsCm) : null,
    neckCm: data.neckCm != null ? String(data.neckCm) : null,
  });

  // Save check-in row (the AI summary gets attached later by /api/checkin).
  await db.insert(schema.weeklyCheckins).values({
    userId: user.id,
    weekNumber: week,
    weightKg: data.weightKg != null ? String(data.weightKg) : null,
    adherenceWorkoutPct: data.workoutAdherencePct ?? null,
    adherenceDietPct: data.dietAdherencePct ?? null,
  });

  revalidatePath("/progress");
  revalidatePath("/dashboard");
  return { weekNumber: week };
}
