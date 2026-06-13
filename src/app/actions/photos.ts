"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/firebase/auth";
import { addProgressPhoto } from "@/lib/firestore/repo";

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

  for (const u of arg.uploads) {
    await addProgressPhoto(user.id, {
      angle: u.angle,
      storagePath: u.storagePath,
      weekNumber: arg.weekNumber ?? 0,
    });
  }

  revalidatePath("/analysis");
}

export async function registerPhotosAndContinue(arg: RegisterArg) {
  await registerPhotos(arg);
  redirect("/analysis?fresh=1");
}
