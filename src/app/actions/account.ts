"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import {
  createClient,
  createServiceClient,
  requireUser,
} from "@/lib/supabase/server";
import {
  UpdateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validation/schemas";
import { deleteAllUserPhotos } from "@/lib/storage/cleanup";

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateProfile(input: UpdateProfileInput) {
  const user = await requireUser();
  const data = UpdateProfileSchema.parse(input);
  await db
    .update(schema.userProfiles)
    .set({
      goal: data.goal,
      trainingDaysPerWeek: data.trainingDaysPerWeek,
      foodPref: data.foodPref,
      dietStyle: data.dietStyle,
      activityLevel: data.activityLevel,
      injuries: data.injuries ?? null,
      updatedAt: sql`now()`,
    })
    .where(eq(schema.userProfiles.userId, user.id));
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

/**
 * Wipe the user's app data (profile, plans, photos, history) but KEEP their
 * account + sign-in. They re-enter the onboarding flow as if fresh.
 *
 * Useful for: testing the full loop, redoing onboarding with corrected info,
 * starting over without losing the login.
 */
export async function resetAccount() {
  const user = await requireUser();
  const service = createServiceClient();

  // 1. Storage photos first (so failures here don't leave DB rows pointing
  //    nowhere — though the bucket clean even works if the DB rows are gone).
  try {
    await deleteAllUserPhotos(service, user.id);
  } catch (e) {
    console.error("[resetAccount] storage cleanup failed:", e);
    // Continue — we still want to wipe the DB rows.
  }

  // 2. DB rows. Many tables CASCADE from workout_plans / diet_plans, but
  //    explicit deletes here document intent and survive schema changes.
  //    Order matters only for tables without FK cascades.
  await db
    .delete(schema.workoutLogs)
    .where(eq(schema.workoutLogs.userId, user.id));
  await db
    .delete(schema.foodLogs)
    .where(eq(schema.foodLogs.userId, user.id));
  await db
    .delete(schema.aiChatMessages)
    .where(eq(schema.aiChatMessages.userId, user.id));
  await db
    .delete(schema.weeklyCheckins)
    .where(eq(schema.weeklyCheckins.userId, user.id));
  await db
    .delete(schema.dietPlans)
    .where(eq(schema.dietPlans.userId, user.id)); // cascades to meal_items
  await db
    .delete(schema.workoutPlans)
    .where(eq(schema.workoutPlans.userId, user.id)); // cascades to workout_days + exercises
  await db
    .delete(schema.bodyAnalysisReports)
    .where(eq(schema.bodyAnalysisReports.userId, user.id));
  await db
    .delete(schema.progressPhotos)
    .where(eq(schema.progressPhotos.userId, user.id));
  await db
    .delete(schema.bodyMeasurements)
    .where(eq(schema.bodyMeasurements.userId, user.id));
  await db
    .delete(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, user.id));

  // Keep: users, subscriptions, user_settings (these survive a reset)

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

/**
 * Permanently delete the entire account: photos, all app rows, AND the auth
 * user. Cannot be undone. After this, the user has to sign up again from
 * scratch to use the app.
 */
export async function deleteAccount() {
  const user = await requireUser();
  const service = createServiceClient();

  // 1. Photos from Supabase Storage (not auto-cascaded by the auth-user delete).
  try {
    await deleteAllUserPhotos(service, user.id);
  } catch (e) {
    console.error("[deleteAccount] storage cleanup failed:", e);
    // Don't abort the account delete — orphan files are recoverable later;
    // a half-deleted account is worse.
  }

  // 2. Public.users row. FK cascades wipe the other app tables.
  await db.delete(schema.users).where(eq(schema.users.id, user.id));

  // 3. Auth user (requires service role).
  await service.auth.admin.deleteUser(user.id);

  // 4. Sign the user out and bounce to landing.
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
