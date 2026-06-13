"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser, clearSessionCookie } from "@/lib/firebase/auth";
import { adminAuth } from "@/lib/firebase/admin";
import {
  upsertProfile,
  resetUserData,
  deleteUserData,
} from "@/lib/firestore/repo";
import {
  UpdateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validation/schemas";

export async function signOut() {
  clearSessionCookie();
  redirect("/");
}

export async function updateProfile(input: UpdateProfileInput) {
  const user = await requireUser();
  const data = UpdateProfileSchema.parse(input);
  await upsertProfile(user.id, {
    goal: data.goal,
    trainingDaysPerWeek: data.trainingDaysPerWeek,
    foodPref: data.foodPref,
    dietStyle: data.dietStyle,
    activityLevel: data.activityLevel,
    injuries: data.injuries ?? null,
  });
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

/**
 * Wipe app data (profile, plans, photos, history) but KEEP the account,
 * subscription, and settings. User re-enters onboarding fresh.
 */
export async function resetAccount() {
  const user = await requireUser();
  await resetUserData(user.id);
  revalidatePath("/", "layout");
  redirect("/onboarding");
}

/**
 * Permanently delete the entire account: all Firestore data, Storage files,
 * AND the Firebase auth user. Cannot be undone.
 */
export async function deleteAccount() {
  const user = await requireUser();
  await deleteUserData(user.id); // cascade: subcollections + Storage folder
  try {
    await adminAuth().deleteUser(user.id);
  } catch (e) {
    console.error("[deleteAccount] auth user delete failed:", e);
  }
  clearSessionCookie();
  redirect("/");
}
