import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Beef,
  Calendar,
  CalendarClock,
  Dumbbell,
  Flame,
  LogOut,
  Salad,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wheat,
} from "lucide-react";
import { getCurrentUser } from "@/lib/firebase/auth";
import { signOut } from "@/app/actions/account";
import {
  getActiveDietPlan,
  getActiveWorkoutPlan,
  getCheckins,
  getLatestAnalysis,
  getProfile,
  getWeightHistory,
  pickTodaysDay,
} from "@/lib/data/user-state";
import { getSettings } from "@/lib/firestore/repo";
import {
  getGreeting,
  formatToday,
  nextCheckinInfo,
  weightDeltas,
  healthyWeightRange,
  profileCompleteness,
} from "@/lib/insights";
import {
  formatWeight,
  toDisplayWeight,
  weightUnitLabel,
  type Units,
} from "@/lib/format/units";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { WeightChart } from "@/components/dashboard/weight-chart";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, analysis, workout, diet, weights, checkins, settings] =
    await Promise.all([
      getProfile(user.id),
      getLatestAnalysis(user.id),
      getActiveWorkoutPlan(user.id),
      getActiveDietPlan(user.id),
      getWeightHistory(user.id),
      getCheckins(user.id).catch(() => []),
      getSettings(user.id).catch(() => null),
    ]);

  if (!profile?.onboardingCompleted) redirect("/home");
  if (!analysis) {
    return <SetupState />;
  }
  if (!workout || !diet) {
    return <NoPlanState />;
  }

  const today = pickTodaysDay(workout.days);

  const units = (settings?.units ?? "metric") as Units;
  const tz = settings?.timezone || undefined;
  const now = new Date();
  const greeting = getGreeting(now, tz);
  const todayStr = formatToday(now, tz);
  const checkin = nextCheckinInfo(checkins, now);
  const deltas = weightDeltas(weights);
  const healthy = healthyWeightRange(profile.heightCm);
  const completeness = profileCompleteness(profile);

  const weightPoints = [...weights]
    .reverse()
    .filter((w) => w.weightKg)
    .map((w) => ({
      date: new Date(w.recordedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      weight: +toDisplayWeight(Number(w.weightKg), units).toFixed(1),
    }));

  const unitLabel = weightUnitLabel(units);
  const healthyMinDisp =
    healthy.minKg != null
      ? +toDisplayWeight(healthy.minKg, units).toFixed(1)
      : null;
  const healthyMaxDisp =
    healthy.maxKg != null
      ? +toDisplayWeight(healthy.maxKg, units).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {greeting} · {todayStr}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            {profile.name ?? "athlete"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="muted">
            Goal:{" "}
            <span className="ml-1 text-foreground">
              {labelForGoal(profile.goal)}
            </span>
          </Badge>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </form>
        </div>
      </header>

      {/* Profile completeness nudge */}
      {completeness.pct < 100 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">
                  Profile {completeness.pct}% complete
                </div>
                <div className="text-xs text-muted-foreground">
                  Add{" "}
                  {completeness.missing.slice(0, 3).join(", ").toLowerCase()}
                  {completeness.missing.length > 3
                    ? ` +${completeness.missing.length - 3} more`
                    : ""}{" "}
                  for sharper plans.
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/settings">Complete</Link>
              </Button>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                style={{ width: `${completeness.pct}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's workout banner */}
      {today && (
        <Card className="card-glow border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <Badge variant="success">Today</Badge>
                </div>
                <h2 className="mt-2 text-xl font-bold md:text-2xl">
                  {today.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {(today.exercises ?? []).length} exercises · ~
                  {Math.round(
                    (today.exercises ?? []).reduce(
                      (sum, e) =>
                        sum + (e.sets ?? 0) * ((e.restSeconds ?? 60) + 45),
                      0,
                    ) / 60,
                  )}{" "}
                  min
                </p>
              </div>
              <Button asChild>
                <Link href="/workout">
                  Start <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Macros row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Today's calories"
          value={diet.plan.targetCalories}
          unit="kcal"
          tone="primary"
          icon={<Flame className="h-5 w-5" />}
        />
        <StatCard
          label="Protein"
          value={diet.plan.proteinG}
          unit="g"
          icon={<Beef className="h-5 w-5" />}
        />
        <StatCard
          label="Carbs"
          value={diet.plan.carbsG}
          unit="g"
          icon={<Wheat className="h-5 w-5" />}
        />
        <StatCard
          label="Fat"
          value={diet.plan.fatG}
          unit="g"
          icon={<Salad className="h-5 w-5" />}
        />
      </div>

      {/* Weight chart + meta */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Weight trend</h3>
                <p className="text-xs text-muted-foreground">
                  Current: {formatWeight(deltas.current, units)}
                  {deltas.thisWeek != null && deltas.thisWeek !== 0 && (
                    <span
                      className={
                        deltas.thisWeek < 0
                          ? "ml-2 inline-flex items-center gap-0.5 text-emerald-400"
                          : "ml-2 inline-flex items-center gap-0.5 text-amber-400"
                      }
                    >
                      {deltas.thisWeek < 0 ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      {formatWeight(Math.abs(deltas.thisWeek), units)} this week
                    </span>
                  )}
                </p>
                {deltas.sinceStart != null && deltas.sinceStart !== 0 && (
                  <p className="text-xs text-muted-foreground">
                    {deltas.sinceStart > 0 ? "+" : "−"}
                    {formatWeight(Math.abs(deltas.sinceStart), units)} since start
                  </p>
                )}
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/progress">Log weight</Link>
              </Button>
            </div>
            <WeightChart
              data={weightPoints}
              healthyMin={healthyMinDisp}
              healthyMax={healthyMaxDisp}
              unit={unitLabel}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">AI coach</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Ask anything — exercise swaps, missed workouts, food substitutions.
            </p>
            <Button asChild className="mt-4 w-full" variant="secondary">
              <Link href="/coach">Open chat</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Plan tiles */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/workout">
          <Card className="transition-all hover:border-primary/40 hover:bg-accent/40">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Dumbbell className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Workout plan</div>
                <div className="font-semibold">{workout.plan.splitName}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/diet">
          <Card className="transition-all hover:border-primary/40 hover:bg-accent/40">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Salad className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Diet plan</div>
                <div className="font-semibold">
                  {diet.plan.targetCalories} kcal · {diet.plan.proteinG}g protein
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Next check-in */}
      <Card
        className={
          checkin.overdue && checkin.hasHistory ? "border-amber-500/40" : ""
        }
      >
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <CalendarClock
              className={
                checkin.overdue && checkin.hasHistory
                  ? "h-5 w-5 text-amber-400"
                  : "h-5 w-5 text-primary"
              }
            />
            <div>
              <div className="text-sm font-medium">
                Week {checkin.nextWeek} check-in
              </div>
              <div className="text-xs text-muted-foreground">
                {!checkin.hasHistory
                  ? "Log your first photos & weight to start tracking."
                  : checkin.overdue
                    ? "Due now — upload photos & weight to update your plan."
                    : checkin.daysUntil === 1
                      ? "Due tomorrow — keep the streak going."
                      : `Due in ${checkin.daysUntil} days — upload photos & weight to update your plan.`}
              </div>
            </div>
          </div>
          <Button
            asChild
            variant={
              checkin.overdue && checkin.hasHistory ? "default" : "outline"
            }
          >
            <Link href="/progress">
              Check in <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Contact / support */}
      <p className="pt-2 text-center text-xs text-muted-foreground">
        Need help? Contact us at{" "}
        <a
          href="mailto:contact@geekbotai.com"
          className="text-primary hover:underline"
        >
          contact@geekbotai.com
        </a>
      </p>
    </div>
  );
}

function SetupState() {
  return (
    <Card className="card-glow">
      <CardContent className="p-12 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-xl font-bold">Set up your plan</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Set up your plan to see your dashboard — answer a few questions and
          add your photos to unlock your AI body analysis.
        </p>
        <Button asChild className="mt-6">
          <Link href="/onboarding">
            Set up my plan <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function NoPlanState() {
  return (
    <Card className="card-glow">
      <CardContent className="p-12 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-xl font-bold">Your plan isn't generated yet</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Run your AI body analysis first, then unlock your training and diet plan.
        </p>
        <Button asChild className="mt-6">
          <Link href="/analysis">
            Go to analysis <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function labelForGoal(g?: string | null): string {
  switch (g) {
    case "fat_loss":
      return "Fat loss";
    case "muscle_gain":
      return "Muscle gain";
    case "recomposition":
      return "Recomposition";
    case "strength":
      return "Strength";
    case "general_fitness":
      return "General fitness";
    default:
      return "—";
  }
}
