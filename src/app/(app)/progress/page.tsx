import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import {
  getCheckins,
  getWeightHistory,
} from "@/lib/data/user-state";
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

  const [weights, checkins, nextWeek] = await Promise.all([
    getWeightHistory(user.id, 30),
    getCheckins(user.id),
    getNextWeekNumber().catch(() => 1),
  ]);

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

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Weekly check-in</p>
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
      </header>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold">Weight trend</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            {weightPoints.length} data points
          </p>
          <WeightChart data={weightPoints} />
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">This week's photos</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Same lighting, same pose — upload before submitting the form below.
        </p>
        <PhotoUpload userId={user.id} weekNumber={nextWeek} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Submit your week</h2>
        </div>
        <CheckinForm defaultWeek={nextWeek} />
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
                      {c.weightKg} kg
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
