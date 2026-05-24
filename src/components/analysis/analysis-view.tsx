import {
  Flame,
  Activity,
  Apple,
  Beef,
  Wheat,
  Droplets,
  ThumbsUp,
  ThumbsDown,
  Target,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { ScoreRing } from "@/components/ui/score-ring";
import { Disclaimer } from "@/components/ui/disclaimer";
import { UnlockButton } from "./unlock-button";
import type { BodyAnalysis } from "@/lib/ai/schemas";

interface Nutrition {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function AnalysisView({
  analysisId,
  analysis,
  nutrition,
}: {
  analysisId: string;
  analysis: BodyAnalysis;
  nutrition: Nutrition;
}) {
  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card card-glow">
        <CardContent className="p-6 md:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="success">{analysis.physique_type}</Badge>
            <Badge variant="muted">
              Est. body fat: {analysis.estimated_body_fat_range}
            </Badge>
            <Badge variant="outline">
              Confidence: {analysis.confidence_level}
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Your AI body analysis
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {analysis.overall_summary}
          </p>
        </CardContent>
      </Card>

      {/* Key metrics — these are deterministic, not AI-estimated. */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="BMI"
          value={nutrition.bmi.toFixed(1)}
          hint={nutrition.bmiCategory}
          icon={<Activity className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="BMR"
          value={nutrition.bmr}
          unit="kcal"
          hint="Resting burn"
          icon={<Flame className="h-5 w-5" />}
        />
        <StatCard
          label="TDEE"
          value={nutrition.tdee}
          unit="kcal"
          hint="Daily burn"
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label="Daily target"
          value={nutrition.targetCalories}
          unit="kcal"
          hint="For your goal"
          icon={<Target className="h-5 w-5" />}
          tone="primary"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Protein"
          value={nutrition.proteinG}
          unit="g"
          icon={<Beef className="h-5 w-5" />}
        />
        <StatCard
          label="Carbs"
          value={nutrition.carbsG}
          unit="g"
          icon={<Wheat className="h-5 w-5" />}
        />
        <StatCard
          label="Fat"
          value={nutrition.fatG}
          unit="g"
          icon={<Droplets className="h-5 w-5" />}
        />
      </div>

      {/* Visual scores */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-1 text-lg font-semibold">Visual category scores</h3>
          <p className="mb-6 text-xs text-muted-foreground">
            AI estimates, 0–100. Calibrated for a typical fitness-app population.
          </p>
          <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
            {(
              [
                ["body_fat", "Body fat"],
                ["muscle_development", "Muscle"],
                ["posture", "Posture"],
                ["symmetry", "Symmetry"],
                ["shoulder_to_waist_ratio", "S-to-W ratio"],
                ["overall_fitness", "Overall"],
              ] as const
            ).map(([key, label]) => (
              <ScoreRing
                key={key}
                value={analysis.scores[key].value}
                label={label}
                sublabel={analysis.scores[key].note}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pros / cons */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-emerald-400" />
              <h3 className="font-semibold">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {analysis.pros.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  {p}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <ThumbsDown className="h-4 w-4 text-amber-400" />
              <h3 className="font-semibold">Areas to improve</h3>
            </div>
            <ul className="space-y-2">
              {analysis.cons.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  {p}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Priority groups + notes */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Priority muscle groups</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.priority_muscle_groups.map((g) => (
              <Badge key={g} variant="default">
                {g}
              </Badge>
            ))}
          </div>
          {analysis.posture_notes.length > 0 && (
            <NoteList title="Posture notes" items={analysis.posture_notes} />
          )}
          {analysis.fat_loss_notes.length > 0 && (
            <NoteList title="Fat loss notes" items={analysis.fat_loss_notes} />
          )}
          {analysis.muscle_gain_notes.length > 0 && (
            <NoteList title="Muscle gain notes" items={analysis.muscle_gain_notes} />
          )}
        </CardContent>
      </Card>

      {/* Roadmap */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <Badge variant="default">30 days</Badge>
            </div>
            <p className="text-sm leading-relaxed">
              {analysis.realistic_30_day_goal}
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <Badge variant="default">90 days</Badge>
            </div>
            <p className="text-sm leading-relaxed">
              {analysis.realistic_90_day_goal}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mystery unlock */}
      <Card className="card-glow border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card">
        <CardContent className="p-6 md:p-8">
          <div className="mb-4 flex items-center gap-2">
            <Apple className="h-4 w-4 text-primary" />
            <Badge variant="success">Next step</Badge>
          </div>
          <h3 className="text-xl font-bold tracking-tight md:text-2xl">
            Ready for your personalized plan?
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Workout split, exercises, sets/reps, diet, grocery list — all built
            from your analysis.
          </p>
          <div className="mt-5">
            <UnlockButton analysisId={analysisId} />
          </div>
        </CardContent>
      </Card>

      <Disclaimer>{analysis.disclaimer}</Disclaimer>
    </div>
  );
}

function NoteList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-5">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <ul className="space-y-1 text-sm">
        {items.map((n, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
            {n}
          </li>
        ))}
      </ul>
    </div>
  );
}
