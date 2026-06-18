import { redirect } from "next/navigation";
import { Sidebar } from "@/components/nav/sidebar";
import { BottomNav } from "@/components/nav/bottom-nav";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getProfile, getSubscription } from "@/lib/firestore/repo";
import { hasPaidAccess } from "@/lib/access";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Whole-app paywall: only paid members (access granted via /thank-you) may
  // use the app. Free / Google-only users are sent to the upgrade screen.
  let subscription = null;
  let profile = null;
  try {
    [subscription, profile] = await Promise.all([
      getSubscription(user.id),
      getProfile(user.id),
    ]);
  } catch {
    // Backend not configured — fall through; gate below treats as no access.
  }
  if (!hasPaidAccess(subscription)) redirect("/upgrade");

  const displayName = profile?.name ?? user.name ?? user.email ?? null;

  return (
    <div className="flex min-h-dvh">
      <Sidebar userName={displayName} />
      <main className="min-w-0 flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
