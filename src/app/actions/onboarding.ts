"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/supabase/server";
import { sql } from "drizzle-orm";
import {
  OnboardingSchema,
  type OnboardingInput,
} from "@/lib/validation/schemas";

export async function submitOnboarding(input: OnboardingInput) {
  const user = await requireUser();
  const data = OnboardingSchema.parse(input);

  await db
    .insert(schema.userProfiles)
    .values({
      userId: user.id,
      name: data.name,
      age: data.age,
      gender: data.gender,
      heightCm: String(data.heightCm),
      weightKg: String(data.weightKg),
      goal: data.goal,
      experience: data.experience,
      trainingLocation: data.trainingLocation,
      equipment: data.equipment,
      trainingDaysPerWeek: data.trainingDaysPerWeek,
      foodPref: data.foodPref,
      dietStyle: data.dietStyle,
      budget: data.budget,
      activityLevel: data.activityLevel,
      injuries: data.injuries ?? null,
      onboardingCompleted: true,
    })
    .onConflictDoUpdate({
      target: schema.userProfiles.userId,
      set: {
        name: data.name,
        age: data.age,
        gender: data.gender,
        heightCm: String(data.heightCm),
        weightKg: String(data.weightKg),
        goal: data.goal,
        experience: data.experience,
        trainingLocation: data.trainingLocation,
        equipment: data.equipment,
        trainingDaysPerWeek: data.trainingDaysPerWeek,
        foodPref: data.foodPref,
        dietStyle: data.dietStyle,
        budget: data.budget,
        activityLevel: data.activityLevel,
        injuries: data.injuries ?? null,
        onboardingCompleted: true,
        updatedAt: sql`now()`,
      },
    });

  // Initial measurement snapshot.
  const m = data.measurements ?? {};
  await db.insert(schema.bodyMeasurements).values({
    userId: user.id,
    weightKg: String(data.weightKg),
    waistCm: m.waistCm != null ? String(m.waistCm) : null,
    chestCm: m.chestCm != null ? String(m.chestCm) : null,
    armsCm: m.armsCm != null ? String(m.armsCm) : null,
    thighsCm: m.thighsCm != null ? String(m.thighsCm) : null,
    hipsCm: m.hipsCm != null ? String(m.hipsCm) : null,
    neckCm: m.neckCm != null ? String(m.neckCm) : null,
  });

  // Ensure users row exists (defensive — usually created by Supabase trigger).
  await db
    .insert(schema.users)
    .values({
      id: user.id,
      email: user.email ?? "",
      name: data.name,
    })
    .onConflictDoUpdate({
      target: schema.users.id,
      set: { name: data.name, updatedAt: sql`now()` },
    });

  revalidatePath("/", "layout");
  redirect("/photos");
}
