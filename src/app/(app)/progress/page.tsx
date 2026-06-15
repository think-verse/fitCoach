import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  getCheckins,
  getProfile,
  getWeightHistory,
} from "@/lib/data/user-state";
import {
  getSettings,
  getPhotoSetsByWeek,
  getSignedPhotoUrl,
  getRecentAnalyses,
} from "@/lib/firestore/repo";
import { getGenerationUsage } from "@/lib/limits/limits";
import { healthyWeightRange } from "@/lib/insights";
import type { BodyAnalysis } from "@/lib/ai/schemas";
import type { PhotoAngle } from "@/lib/firestore/types";
import { WeekComparison, type Trend } from "@/components/progress/week-comparison";
import {
  formatWeight,
  toDisplayWeight,
  weightUnitLabel,
  type Units,
} from "@/lib/format/units";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckinForm } from "@/components/progress/checkin-form";
import { PhotoUpload } from "@/components/onboarding/photo-upload";
import { WeightChart } from "@/components/dashboard/weight-chart";
import { getNextWeekNumber } from "@/app/actions/checkin";
import { CalendarCheck, Camera } from "lucide-react";

export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [weights, checkins, nextWeek, profile, settings, genUsage, recentAnalyses] =
    await Promise.all([
      getWeightHistory(user.id, 30),
      getCheckins(user.id),
      getNextWeekNumber().catch(() => 1),
      getProfile(user.id).catch(() => null),
      getSettings(user.id).catch(() => null),
      getGenerationUsage(user.id).catch(() => null),
      getRecentAnalyses(user.id, 2).catch(() => []),
    ]);

  // Fat/muscle trends come from comparing the two most recent AI photo analyses
  // (the gated, limited flow) — not the free check-in. We return the raw
  // direction the SCORE moved; WeekComparison decides whether up/down is good
  // per metric (fat-down = good, muscle-up = good).
  function scoreTrend(latest: number | undefined, prev: number | undefined): Trend {
    if (latest == null || prev == null) return "unclear";
    const diff = latest - prev;
    if (Math.abs(diff) < 2) return "flat";
    return diff > 0 ? "up" : "down";
  }
  const latestReport = recentAnalyses[0]?.report as BodyAnalysis | undefined;
  const prevReport = recentAnalyses[1]?.report as BodyAnalysis | undefined;
  const fatTrend: Trend = scoreTrend(
    latestReport?.scores?.body_fat?.value,
    prevReport?.scores?.body_fat?.value,
  );
  const muscleTrend: Trend = scoreTrend(
    latestReport?.scores?.muscle_development?.value,
    prevReport?.scores?.muscle_development?.value,
  );

  const units = (settings?.units ?? "metric") as Units;
  const unitLabel = weightUnitLabel(units);
  const healthy = healthyWeightRange(profile?.heightCm);
  const healthyMinDisp =
    healthy.minKg != null ? +toDisplayWeight(healthy.minKg, units).toFixed(1) : null;
  const healthyMaxDisp =
    healthy.maxKg != null ? +toDisplayWeight(healthy.maxKg, units).toFixed(1) : null;

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

  // Week-over-week comparison: the two most recent weeks that have a full
  // photo set (front/side/back). Needs at least two to be meaningful.
  const photoSets = await getPhotoSetsByWeek(user.id).catch(() => []);
  const completeSets = photoSets.filter((s) => s.complete);
  const currentSet = completeSets[0];
  const previousSet = completeSets[1];
  const completePhotoWeeks = completeSets.length;

  let comparison: Awaited<ReturnType<typeof buildComparison>> = null;
  async function buildComparison() {
    if (!currentSet || !previousSet) return null;
    const angles: PhotoAngle[] = ["front", "side", "back"];
    const pairs = await Promise.all(
      angles.map(async (angle) => {
        const prev = previousSet.byAngle[angle];
        const curr = currentSet.byAngle[angle];
        const [previousUrl, currentUrl] = await Promise.all([
          prev ? getSignedPhotoUrl(prev.storagePath) : Promise.resolve(null),
          curr ? getSignedPhotoUrl(curr.storagePath) : Promise.resolve(null),
        ]);
        return { angle, previousUrl, currentUrl };
      }),
    );

    // Weight delta = latest logged weight vs the one before it (from the actual
    // weight history, not keyed to photo-week numbers — that mismatch was why it
    // showed "No weight logged" even after a check-in).
    const logged = weights.filter((w) => w.weightKg != null);
    const curW = logged[0]?.weightKg;
    const prevW = logged[1]?.weightKg;
    const weightDelta =
      curW != null && prevW != null
        ? +(
            toDisplayWeight(Number(curW), units) -
            toDisplayWeight(Number(prevW), units)
          ).toFixed(1)
        : null;

    return {
      previousWeek: previousSet.weekNumber,
      currentWeek: currentSet.weekNumber,
      pairs,
      fatTrend,
      muscleTrend,
      weightDelta,
    };
  }
  comparison = await buildComparison();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Weekly check-in</p>
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
      </header>

      {comparison ? (
        <WeekComparison
          previousWeek={comparison.previousWeek}
          currentWeek={comparison.currentWeek}
          pairs={comparison.pairs}
          fatTrend={comparison.fatTrend}
          muscleTrend={comparison.muscleTrend}
          weightDelta={comparison.weightDelta}
          weightUnit={unitLabel}
        />
      ) : completePhotoWeeks === 1 ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
            <Camera className="h-5 w-5 shrink-0 text-primary" />
            <span>
              Upload a full photo set (front, side &amp; back) for a second week
              to unlock your side-by-side transformation comparison.
            </span>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold">Weight trend</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            {weightPoints.length} data points
          </p>
          <WeightChart
            data={weightPoints}
            healthyMin={healthyMinDisp}
            healthyMax={healthyMaxDisp}
            unit={unitLabel}
          />
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">This week's photos &amp; AI analysis</h2>
          {genUsage && (
            <div className="ml-auto flex items-center gap-1.5">
              <Badge variant={genUsage.week.remaining > 0 ? "muted" : "default"}>
                {genUsage.week.remaining}/{genUsage.week.limit} left this week
              </Badge>
              <Badge variant="muted">
                {genUsage.month.remaining}/{genUsage.month.limit} this month
              </Badge>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Same lighting, same pose. Uploading photos runs your AI body analysis —
          that&apos;s the part that uses a generation from your plan limit. The
          check-in below is free and unlimited.
        </p>
        <PhotoUpload userId={user.id} weekNumber={nextWeek} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Submit your week</h2>
        </div>
        <CheckinForm defaultWeek={nextWeek} weightUnit={unitLabel} />
      </div>

      {checkins.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Past check-ins</h2>
          {checkins.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Badge variant="default">Week {c.weekNumber}</Badge>
                  {c.weightKg && (
                    <span className="text-sm text-muted-foreground">
                      {formatWeight(c.weightKg, units)}
                    </span>
                  )}
                  {c.consistencyScore != null && (
                    <Badge variant="muted">
                      Consistency {c.consistencyScore}%
                    </Badge>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {c.summary &&
                typeof c.summary === "object" &&
                "progress_summary" in c.summary ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {(c.summary as { progress_summary: string }).progress_summary}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
