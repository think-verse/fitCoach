"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/firebase/auth";
import {
  getCheckins,
  addMeasurement,
  saveCheckin as saveCheckinDoc,
} from "@/lib/firestore/repo";
import { CheckinSchema, type CheckinInput } from "@/lib/validation/schemas";

/** Compute the next week number for this user (max existing + 1). */
export async function getNextWeekNumber(): Promise<number> {
  const user = await requireUser();
  const checkins = await getCheckins(user.id); // ordered weekNumber desc
  const max = checkins[0]?.weekNumber ?? 0;
  return Math.max(1, max + 1);
}

export async function saveCheckin(input: CheckinInput, weekNumber?: number) {
  const user = await requireUser();
  const data = CheckinSchema.parse(input);
  const week = weekNumber ?? (await getNextWeekNumber());

  // Measurement snapshot.
  await addMeasurement(user.id, {
    weightKg: data.weightKg ?? null,
    waistCm: data.waistCm ?? null,
    chestCm: data.chestCm ?? null,
    armsCm: data.armsCm ?? null,
    thighsCm: data.thighsCm ?? null,
    hipsCm: data.hipsCm ?? null,
    neckCm: data.neckCm ?? null,
  });

  // Check-in doc (AI summary attached later by /api/checkin).
  await saveCheckinDoc(user.id, {
    weekNumber: week,
    weightKg: data.weightKg ?? null,
    adherenceWorkoutPct: data.workoutAdherencePct ?? null,
    adherenceDietPct: data.dietAdherencePct ?? null,
    consistencyScore: null,
    summary: null,
  });

  revalidatePath("/progress");
  revalidatePath("/dashboard");
  return { weekNumber: week };
}
