import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Beef,
  Calendar,
  Dumbbell,
  Flame,
  Salad,
  Sparkles,
  Wheat,
} from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server";
import {
  getActiveDietPlan,
  getActiveWorkoutPlan,
  getLatestAnalysis,
  getProfile,
  getWeightHistory,
  pickTodaysDay,
} from "@/lib/data/user-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { WeightChart } from "@/components/dashboard/weight-chart";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, analysis, workout, diet, weights] = await Promise.all([
    getProfile(user.id),
    getLatestAnalysis(user.id),
    getActiveWorkoutPlan(user.id),
    getActiveDietPlan(user.id),
    getWeightHistory(user.id),
  ]);

  if (!profile?.onboardingCompleted) redirect("/onboarding");
  if (!analysis) redirect("/photos");
  if (!workout || !diet) {
    return <NoPlanState />;
  }

  const today = pickTodaysDay(workout.days);
  const weightPoints = [...weights]
    .reverse()
    .filter((w) => w.weightKg)
    .map((w) => ({
      date: new Date(w.recordedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      weight: Number(w.weightKg),
    }));

  // Most recent row may be a check-in with no weight logged — skip nulls so
  // "Current" shows the user's actual last known weight, not a dash.
  const weighed = weights.filter((w) => w.weightKg != null);
  const currentWeight = weighed[0]?.weightKg ? Number(weighed[0].weightKg) : null;
  const startWeight =
    weighed.length > 1
      ? Number(weighed[weighed.length - 1].weightKg ?? 0)
      : currentWeight;
  const delta =
    currentWeight && startWeight ? +(currentWeight - startWeight).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-3xl font-bold tracking-tight">
            {profile.name ?? "athlete"}
          </h1>
        </div>
        <Badge variant="muted">
          Goal: <span className="ml-1 text-foreground">{labelForGoal(profile.goal)}</span>
        </Badge>
      </header>

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
                  {today.exercises.length} exercises · ~
                  {Math.round(
                    today.exercises.reduce(
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
                  Current: {currentWeight ?? "—"} kg
                  {delta !== 0 && (
                    <span
                      className={
                        delta < 0
                          ? "ml-2 text-emerald-400"
                          : "ml-2 text-amber-400"
                      }
                    >
                      {delta > 0 ? "+" : ""}
                      {delta} kg since start
                    </span>
                  )}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/progress">Log weight</Link>
              </Button>
            </div>
            <WeightChart data={weightPoints} />
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
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-medium">Weekly check-in</div>
              <div className="text-xs text-muted-foreground">
                Upload new photos &amp; weight to update your plan.
              </div>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/progress">
              Check in <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
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
