import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getProfile } from "@/lib/firestore/repo";

export const metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // If onboarding already completed, send them to the photo step.
  let profile = null;
  try {
    profile = await getProfile(user.id);
  } catch {
    /* backend not configured — render form anyway */
  }

  if (profile?.onboardingCompleted) redirect("/photos");

  const initialName = user.name ?? user.email?.split("@")[0];

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
