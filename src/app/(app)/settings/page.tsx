import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getProfile, getSubscription } from "@/lib/firestore/repo";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/onboarding");

  const subscription = await getSubscription(user.id).catch(() => null);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Your preferences</p>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </header>
      <SettingsForm
        profile={profile}
        subscription={subscription ?? null}
        email={user.email ?? null}
      />
    </div>
  );
}
