import { redirect } from "next/navigation";
import { Flame, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getSubscription } from "@/lib/firestore/repo";
import { hasPaidAccess } from "@/lib/access";
import { signOut } from "@/app/actions/account";

const APP_NAME = "AesthetixAI";
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "contact@geekbotai.com";

export const metadata = { title: `Unlock ${APP_NAME}` };

/**
 * Locked screen for signed-in but non-paid (free / Google) users. Paid members
 * are bounced straight into the app.
 */
export default async function UpgradePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sub = await getSubscription(user.id).catch(() => null);
  if (hasPaidAccess(sub)) redirect("/home");

  const PERKS = [
    "AI physique scan & body analysis",
    "Personalized workout plan",
    "Personalized diet plan with macros",
    "Unlimited AI coach chat",
    "Weekly check-ins that adapt your plan",
  ];

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero-glow opacity-70" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Flame className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        </div>

        <Card className="card-glow">
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight">
              Your account is free
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              {APP_NAME} is members-only. Once you purchase, you&apos;ll land on
              our thank-you page and instantly get your login — then everything
              below unlocks.
            </p>

            <ul className="mt-6 space-y-2 text-left">
              {PERKS.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {p}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Already purchased? Sign in with the email &amp; password we sent.
            </div>

            <p className="mt-6 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              Need help?{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
                {CONTACT_EMAIL}
              </a>
            </p>

            <form action={signOut} className="mt-6">
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
