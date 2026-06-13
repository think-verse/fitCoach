import { redirect } from "next/navigation";
import {
  Activity,
  CalendarCheck,
  Dumbbell,
  Scale,
  TrendingDown,
} from "lucide-react";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  getCheckins,
  getLatestAnalysis,
  getProfile,
  getWeightHistory,
} from "@/lib/data/user-state";
import { getSubscription } from "@/lib/firestore/repo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import {
  ProgressChart,
  type ProgressPoint,
} from "@/components/profile/progress-chart";
import type { WeeklyCheckin } from "@/lib/firestore/types";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, weights, checkins, analysis, subscription] =
    await Promise.all([
      getProfile(user.id),
      getWeightHistory(user.id, 60),
      getCheckins(user.id),
      getLatestAnalysis(user.id).catch(() => null),
      getSubscription(user.id).catch(() => null),
    ]);

  if (!profile) redirect("/home");

  // --- Weight figures (measurements come newest-first) -----------------
  const weighed = weights.filter((w) => w.weightKg != null);
  const currentWeight = weighed[0]?.weightKg
    ? Number(weighed[0].weightKg)
    : null;
  const startWeight =
    weighed.length > 1
      ? Number(weighed[weighed.length - 1].weightKg ?? 0)
      : null;
  const delta =
    currentWeight != null && startWeight != null
      ? +(currentWeight - startWeight).toFixed(1)
      : null;

  // --- Chart data: prefer check-ins (week by week), else measurements --
  const checkinPoints: ProgressPoint[] = [...checkins]
    .filter((c) => c.weightKg != null)
    .sort((a, b) => a.weekNumber - b.weekNumber)
    .map((c) => ({
      label: `Wk ${c.weekNumber}`,
      weight: Number(c.weightKg),
    }));

  const measurementPoints: ProgressPoint[] = [...weighed]
    .reverse()
    .map((w) => ({
      label: new Date(w.recordedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      weight: Number(w.weightKg),
    }));

  const chartData =
    checkinPoints.length >= 2 ? checkinPoints : measurementPoints;

  const initial = (profile.name ?? "A").trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Your profile</p>
          <h1 className="text-3xl font-bold tracking-tight">
            {profile.name ?? "Athlete"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={subscription?.tier === "free" ? "muted" : "success"}
          >
            {subscription?.tier?.replace("_", " ") ?? "free"}
          </Badge>
          <Badge variant="default">{labelForGoal(profile.goal)}</Badge>
        </div>
      </header>

      {/* 1. Profile summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary ring-1 ring-primary/30">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold">
                {profile.name ?? "Athlete"}
              </div>
              <div className="truncate text-sm text-muted-foreground">
                {user.email ?? "—"}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-x-6 sm:grid-cols-2">
            <Row label="Age" value={profile.age ?? "—"} />
            <Row
              label="Height"
              value={profile.heightCm ? `${profile.heightCm} cm` : "—"}
            />
            <Row
              label="Starting weight"
              value={
                startWeight != null
                  ? `${fmt(startWeight)} kg`
                  : profile.weightKg != null
                    ? `${fmt(Number(profile.weightKg))} kg`
                    : "—"
              }
            />
            <Row label="Goal" value={labelForGoal(profile.goal)} />
            <Row label="Experience" value={labelForExperience(profile.experience)} />
            <Row
              label="Training days / week"
              value={profile.trainingDaysPerWeek ?? "—"}
            />
            <Row label="Member since" value={formatDate(profile.createdAt)} />
          </div>
        </CardContent>
      </Card>

      {/* 2. Key stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Current weight"
          value={currentWeight != null ? fmt(currentWeight) : "—"}
          unit={currentWeight != null ? "kg" : undefined}
          tone="primary"
          icon={<Scale className="h-5 w-5" />}
        />
        <StatCard
          label="Change since start"
          value={
            delta != null
              ? `${delta > 0 ? "+" : ""}${fmt(delta)}`
              : "—"
          }
          unit={delta != null ? "kg" : undefined}
          tone={delta != null && delta > 0 ? "warning" : "default"}
          icon={<TrendingDown className="h-5 w-5" />}
        />
        <StatCard
          label="BMI"
          value={analysis?.bmi != null ? fmt(Number(analysis.bmi)) : "—"}
          hint={analysis?.bmiCategory ?? undefined}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label="Weeks tracked"
          value={checkins.length}
          icon={<CalendarCheck className="h-5 w-5" />}
        />
      </div>

      {/* 3. Progress over time */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold">Progress over time</h3>
            <p className="text-xs text-muted-foreground">
              Current: {currentWeight != null ? `${fmt(currentWeight)} kg` : "—"}
              {delta != null && delta !== 0 && (
                <span
                  className={
                    delta < 0 ? "ml-2 text-emerald-400" : "ml-2 text-amber-400"
                  }
                >
                  {delta > 0 ? "+" : ""}
                  {fmt(delta)} kg since start
                </span>
              )}
            </p>
          </div>
          <ProgressChart data={chartData} />
        </CardContent>
      </Card>

      {/* 4. Weekly history */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Weekly history</h2>
        {checkins.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Dumbbell className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                No check-ins yet. Submit a weekly check-in to start tracking
                your progress.
              </p>
            </CardContent>
          </Card>
        ) : (
          checkins.map((c) => <CheckinCard key={c.id} checkin={c} />)
        )}
      </div>
    </div>
  );
}

function CheckinCard({ checkin: c }: { checkin: WeeklyCheckin }) {
  const summary =
    c.summary &&
    typeof c.summary === "object" &&
    "progress_summary" in c.summary
      ? (c.summary as { progress_summary?: unknown }).progress_summary
      : null;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="default">Week {c.weekNumber}</Badge>
          {c.weightKg != null && (
            <span className="text-sm text-muted-foreground">
              {fmt(Number(c.weightKg))} kg
            </span>
          )}
          {c.adherenceWorkoutPct != null && (
            <Badge variant="muted">Workout {c.adherenceWorkoutPct}%</Badge>
          )}
          {c.adherenceDietPct != null && (
            <Badge variant="muted">Diet {c.adherenceDietPct}%</Badge>
          )}
          {c.consistencyScore != null && (
            <Badge variant="success">Consistency {c.consistencyScore}%</Badge>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {formatDate(c.createdAt)}
          </span>
        </div>
        {typeof summary === "string" && summary.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">{summary}</p>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 last:border-0 sm:[&:nth-last-child(2)]:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function fmt(n: number): string {
  return Number.isFinite(n) ? n.toFixed(1) : "—";
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

function labelForExperience(e?: string | null): string {
  switch (e) {
    case "beginner":
      return "Beginner";
    case "intermediate":
      return "Intermediate";
    case "advanced":
      return "Advanced";
    default:
      return "—";
  }
}
