"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/supabase/server";

interface RegisterArg {
  uploads: Array<{
    angle: "front" | "side" | "back";
    storagePath: string;
  }>;
  weekNumber?: number;
}

export async function registerPhotos(arg: RegisterArg) {
  const user = await requireUser();
  if (!arg.uploads?.length) return;

  await db.insert(schema.progressPhotos).values(
    arg.uploads.map((u) => ({
      userId: user.id,
      angle: u.angle,
      storagePath: u.storagePath,
      weekNumber: arg.weekNumber ?? 0,
    })),
  );

  revalidatePath("/analysis");
}

export async function registerPhotosAndContinue(arg: RegisterArg) {
  await registerPhotos(arg);
  redirect("/analysis?fresh=1");
}
