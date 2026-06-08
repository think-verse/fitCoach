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

export async function deleteAccount() {
  const user = await requireUser();

  // Cascade DB rows (schema FKs are ON DELETE CASCADE).
  await db.delete(schema.users).where(eq(schema.users.id, user.id));

  // Delete the auth user via the service client.
  const service = createServiceClient();
  await service.auth.admin.deleteUser(user.id);

  // Sign the user out and redirect.
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
