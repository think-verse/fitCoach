import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getSubscription } from "@/lib/firestore/repo";
import { hasPaidAccess } from "@/lib/access";

/**
 * The onboarding → photos → analysis → generate flow is part of the paid
 * experience, so it carries the same paywall as the main app: signed-in AND
 * paid, else bounce to /login or /upgrade.
 */
export default async function FlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sub = await getSubscription(user.id).catch(() => null);
  if (!hasPaidAccess(sub)) redirect("/upgrade");

  return <>{children}</>;
}
