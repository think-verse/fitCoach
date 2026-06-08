import { redirect } from "next/navigation";
import { Sidebar } from "@/components/nav/sidebar";
import { BottomNav } from "@/components/nav/bottom-nav";
import { getCurrentUser } from "@/lib/supabase/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // If onboarding hasn't happened, push them through it first.
  let profile = null;
  try {
    [profile] = await db
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, user.id))
      .limit(1);
  } catch {
    // DB not configured — let the page render its empty/error state.
  }

  // No profile = brand-new account OR data was reset → onboarding.
  // Profile exists but onboarding not completed = same.
  if (!profile || !profile.onboardingCompleted) {
    redirect("/onboarding");
  }

  const displayName =
    profile?.name ?? user.user_metadata?.name ?? user.email ?? null;

  return (
    <div className="flex min-h-dvh">
      <Sidebar userName={displayName} />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
