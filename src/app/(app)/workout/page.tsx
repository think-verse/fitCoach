import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, Dumbbell, Repeat, Target, Activity } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server";
import { getActiveWorkoutPlan } from "@/lib/data/user-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExerciseVideo } from "@/components/workout/exercise-video";

export const metadata = { title: "Workout plan" };

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function WorkoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getActiveWorkoutPlan(user.id);
  if (!data) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Dumbbell className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-bold">No active plan</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Generate your plan from the analysis page.
          </p>
          <Button asChild className="mt-6">
            <Link href="/analysis">Run analysis</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { plan, days } = data;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Your weekly split</p>
        <h1 className="text-3xl font-bold tracking-tight">{plan.splitName}</h1>
        {plan.notes && (
          <p className="mt-2 text-sm text-muted-foreground">{plan.notes}</p>
        )}
      </header>

      <div className="space-y-4">
        {days.map((day) => (
          <Card key={day.id} id={`day-${day.dayIndex}`}>
            <CardContent className="p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      {DAY_NAMES[day.dayIndex] ?? `Day ${day.dayIndex + 1}`}
                    </Badge>
                    <Badge variant="muted">{day.focus}</Badge>
                  </div>
                  <h2 className="mt-2 text-lg font-bold">{day.title}</h2>
                </div>
                <div className="text-xs text-muted-foreground">
                  {day.exercises.length} exercises
                </div>
              </div>

              {day.warmup && (
                <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <span className="font-semibold text-foreground">Warm-up:</span>{" "}
                  <span className="text-muted-foreground">{day.warmup}</span>
                </div>
              )}

              <div className="space-y-3">
                {day.exercises.map((ex) => (
                  <Card key={ex.id} className="border-border/60">
                    <CardContent className="p-4">
                      <div className="grid items-start gap-4 sm:grid-cols-[minmax(260px,2fr)_3fr]">
                        <ExerciseVideo
                          src={ex.demoVideoUrl}
                          alt={ex.name}
                        />
                        <div className="min-w-0">
                          <div className="font-semibold">{ex.name}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            <Target className="mr-1 inline h-3 w-3" />
                            {ex.targetMuscle}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Repeat className="h-3 w-3 text-primary" />
                          {ex.sets} × {ex.reps}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-primary" />
                          {ex.restSeconds}s rest
                        </span>
                        {ex.rpe && (
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3 text-primary" />
                            {ex.rpe}
                          </span>
                        )}
                        {ex.tempo && (
                          <Badge variant="outline" className="text-[10px]">
                            tempo {ex.tempo}
                          </Badge>
                        )}
                      </div>

                      {ex.formCues && ex.formCues.length > 0 && (
                        <Details title="Form cues" items={ex.formCues} />
                      )}
                      {ex.commonMistakes && ex.commonMistakes.length > 0 && (
                        <Details title="Common mistakes" items={ex.commonMistakes} />
                      )}
                      {ex.progressionRule && (
                        <div className="mt-3 rounded-md bg-primary/10 px-3 py-2 text-xs text-primary">
                          <span className="font-semibold">Progression: </span>
                          {ex.progressionRule}
                        </div>
                      )}
                      {ex.alternativeExercise && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="font-semibold">Alternative: </span>
                          {ex.alternativeExercise}
                        </div>
                      )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {day.cooldown && (
                <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <span className="font-semibold text-foreground">Cooldown:</span>{" "}
                  <span className="text-muted-foreground">{day.cooldown}</span>
                </div>
              )}
              {day.cardio && (
                <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <span className="font-semibold text-foreground">Cardio:</span>{" "}
                  <span className="text-muted-foreground">{day.cardio}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Details({ title, items }: { title: string; items: string[] }) {
  return (
    <details className="group mt-3">
      <summary className="cursor-pointer text-xs font-semibold text-muted-foreground group-open:text-foreground">
        {title} ({items.length})
      </summary>
      <ul className="mt-2 space-y-1 pl-3 text-xs text-muted-foreground">
        {items.map((c, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
            {c}
          </li>
        ))}
      </ul>
    </details>
  );
}
