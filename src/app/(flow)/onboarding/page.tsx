import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getCurrentUser } from "@/lib/supabase/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export const metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // If onboarding already completed and they have photos, send them to dashboard.
  let profile = null;
  try {
    [profile] = await db
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, user.id))
      .limit(1);
  } catch {
    /* db not configured — render form anyway */
  }

  if (profile?.onboardingCompleted) redirect("/photos");

  const initialName =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0];

  return (
    <div className="min-h-dvh bg-hero-glow px-4 py-10 md:py-16">
      <div className="mx-auto mb-8 max-w-xl text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Set up your <span className="gradient-text">coach</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Six quick steps. Two minutes total.
        </p>
      </div>
      <OnboardingForm initialName={initialName} />
    </div>
  );
}
