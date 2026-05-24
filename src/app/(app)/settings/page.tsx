import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/supabase/server";
import { db, schema } from "@/lib/db";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile] = await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, user.id))
    .limit(1);
  if (!profile) redirect("/onboarding");

  const [subscription] = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, user.id))
    .limit(1)
    .catch(() => [null]);

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
