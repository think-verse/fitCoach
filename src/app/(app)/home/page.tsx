import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Dumbbell,
  LineChart,
  Salad,
  Sparkles,
  User,
} from "lucide-react";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getProfile, getCheckins, getSettings } from "@/lib/firestore/repo";
import { getGreeting, formatToday, nextCheckinInfo } from "@/lib/insights";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export const metadata = { title: "Home" };

const QUICK_ACTIONS = [
  {
    href: "/workout",
    title: "Workout",
    description: "Your training split, exercise by exercise.",
    icon: Dumbbell,
  },
  {
    href: "/diet",
    title: "Diet",
    description: "Daily macros and meal guidance.",
    icon: Salad,
  },
  {
    href: "/progress",
    title: "Progress",
    description: "Log weight and track your trend.",
    icon: LineChart,
  },
  {
    href: "/coach",
    title: "AI Coach",
    description: "Ask anything, get instant answers.",
    icon: Bot,
  },
  {
    href: "/profile",
    title: "Profile",
    description: "Review and edit your details.",
    icon: User,
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, checkins, settings] = await Promise.all([
    getProfile(user.id).catch(() => null),
    getCheckins(user.id).catch(() => []),
    getSettings(user.id).catch(() => null),
  ]);
  const displayName = profile?.name ?? user.name ?? "athlete";
  const onboarded = !!profile?.onboardingCompleted;

  const tz = settings?.timezone || undefined;
  const now = new Date();
  const greeting = getGreeting(now, tz);
  const todayStr = formatToday(now, tz);
  const checkin = nextCheckinInfo(checkins, now);

  const checkinLine =
    onboarded && checkin.hasHistory
      ? checkin.overdue
        ? `Your week ${checkin.nextWeek} check-in is due now.`
        : checkin.daysUntil === 1
          ? `Your week ${checkin.nextWeek} check-in is due tomorrow.`
          : `Your week ${checkin.nextWeek} check-in is due in ${checkin.daysUntil} days.`
      : null;

  return (
    <div className="space-y-8">
      <Reveal>
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {greeting} · {todayStr}
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Welcome, <span className="gradient-text">{displayName}</span> 👋
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground md:text-base">
            {checkinLine ??
              "You're signed in. Create your personalized plan whenever you're ready."}
          </p>
        </header>
      </Reveal>

      <Reveal delay={0.05}>
        <Card className="card-glow border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card">
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {onboarded ? "You're all set" : "Get started"}
                </span>
              </div>
              <h2 className="text-xl font-bold md:text-2xl">
                {onboarded
                  ? "Jump back into your plan"
                  : "Build your personalized plan"}
              </h2>
              <p className="max-w-md text-sm text-muted-foreground">
                {onboarded
                  ? "Pick up where you left off or review your profile."
                  : "Answer a few questions, add your photos, and let the AI craft your training and diet."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {onboarded ? (
                <>
                  <Button asChild size="lg">
                    <Link href="/dashboard">
                      Go to dashboard <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/profile">View my profile</Link>
                  </Button>
                </>
              ) : (
                <Button asChild size="lg">
                  <Link href="/onboarding">
                    Create my plan <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </Reveal>

      <section className="space-y-4">
        <Reveal delay={0.1}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Quick actions
          </h3>
        </Reveal>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action, i) => {
            const Icon = action.icon;
            return (
              <Reveal key={action.href} delay={0.12 + i * 0.04}>
                <Link href={action.href}>
                  <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/40">
                    <CardContent className="flex items-start gap-4 p-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold">{action.title}</div>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}
