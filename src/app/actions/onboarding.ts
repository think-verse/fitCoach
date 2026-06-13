"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/firebase/auth";
import {
  ensureUser,
  upsertProfile,
  addMeasurement,
} from "@/lib/firestore/repo";
import {
  OnboardingSchema,
  type OnboardingInput,
} from "@/lib/validation/schemas";

export async function submitOnboarding(input: OnboardingInput) {
  const user = await requireUser();
  const data = OnboardingSchema.parse(input);

  await ensureUser(user.id, user.email ?? "", data.name);

  await upsertProfile(user.id, {
    name: data.name,
    age: data.age,
    gender: data.gender,
    heightCm: data.heightCm,
    weightKg: data.weightKg,
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
  });

  // Initial measurement snapshot (week 0 baseline).
  const m = data.measurements ?? {};
  await addMeasurement(user.id, {
    weightKg: data.weightKg,
    waistCm: m.waistCm ?? null,
    chestCm: m.chestCm ?? null,
    armsCm: m.armsCm ?? null,
    thighsCm: m.thighsCm ?? null,
    hipsCm: m.hipsCm ?? null,
    neckCm: m.neckCm ?? null,
  });

  revalidatePath("/", "layout");
  redirect("/photos");
}
