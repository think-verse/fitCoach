"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { submitOnboarding } from "@/app/actions/onboarding";
import type { OnboardingInput } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";

type FormState = Partial<OnboardingInput> & {
  measurements?: NonNullable<OnboardingInput["measurements"]>;
};

const STEPS = [
  "About you",
  "Body",
  "Your goal",
  "Training",
  "Diet",
  "Optional measurements",
] as const;

const EQUIPMENT_OPTIONS = [
  "Dumbbells",
  "Barbell",
  "Bench",
  "Pull-up bar",
  "Resistance bands",
  "Cables/machines",
  "Squat rack",
  "Kettlebells",
  "Bodyweight only",
];

export function OnboardingForm({ initialName }: { initialName?: string }) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<FormState>({
    name: initialName ?? "",
    gender: undefined,
    equipment: [],
    activityLevel: "moderate",
    measurements: {},
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  function next() {
    setError(null);
    const err = validateStep(step, state);
    if (err) {
      setError(err);
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await submitOnboarding(state as OnboardingInput);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not save your profile. Try again.",
        );
      }
    });
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-6 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="mb-8" />

      <Card className="card-glow">
        <CardContent className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && <StepAbout state={state} set={set} />}
              {step === 1 && <StepBody state={state} set={set} />}
              {step === 2 && <StepGoal state={state} set={set} />}
              {step === 3 && <StepTraining state={state} set={set} />}
              {step === 4 && <StepDiet state={state} set={set} />}
              {step === 5 && <StepMeasurements state={state} set={set} />}
            </motion.div>
          </AnimatePresence>

          {error && (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button
              onClick={back}
              disabled={step === 0 || isPending}
              variant="ghost"
              size="lg"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} size="lg">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit} size="lg" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Finish &amp; upload photos
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------- Step UIs */

function StepAbout({
  state,
  set,
}: {
  state: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <Heading title="Let's start with you" subtitle="The basics. Takes 20 seconds." />
      <Field label="Your name">
        <Input
          value={state.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Alex"
          autoFocus
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Age">
          <Input
            type="number"
            inputMode="numeric"
            value={state.age ?? ""}
            onChange={(e) =>
              set("age", e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="28"
          />
        </Field>
        <Field label="Gender">
          <Select
            value={state.gender ?? ""}
            onChange={(e) => set("gender", e.target.value as FormState["gender"])}
          >
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        </Field>
      </div>
    </div>
  );
}

function StepBody({
  state,
  set,
}: {
  state: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <Heading title="Your body" subtitle="Used for BMI, BMR, calorie targets." />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Height (cm)">
          <Input
            type="number"
            inputMode="numeric"
            value={state.heightCm ?? ""}
            onChange={(e) =>
              set("heightCm", e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="175"
          />
        </Field>
        <Field label="Weight (kg)">
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={state.weightKg ?? ""}
            onChange={(e) =>
              set("weightKg", e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="72.5"
          />
        </Field>
      </div>
      <Field label="Daily activity (outside of training)">
        <Select
          value={state.activityLevel ?? "moderate"}
          onChange={(e) =>
            set("activityLevel", e.target.value as FormState["activityLevel"])
          }
        >
          <option value="sedentary">Sedentary — desk job, little walking</option>
          <option value="light">Light — some walking</option>
          <option value="moderate">Moderate — daily walking + chores</option>
          <option value="active">Active — on feet most of the day</option>
          <option value="very_active">Very active — physical job</option>
        </Select>
      </Field>
    </div>
  );
}

function StepGoal({
  state,
  set,
}: {
  state: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const options: Array<{
    v: NonNullable<FormState["goal"]>;
    title: string;
    sub: string;
  }> = [
    { v: "fat_loss", title: "Fat loss", sub: "Lose body fat, keep muscle." },
    { v: "muscle_gain", title: "Muscle gain", sub: "Build size & strength." },
    {
      v: "recomposition",
      title: "Recomposition",
      sub: "Lose fat & gain muscle.",
    },
    { v: "strength", title: "Strength", sub: "Get stronger on the big lifts." },
    {
      v: "general_fitness",
      title: "General fitness",
      sub: "Feel better, move better.",
    },
  ];
  return (
    <div className="space-y-5">
      <Heading title="Your main goal" subtitle="Plan calories & training around it." />
      <div className="grid gap-2">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => set("goal", o.v)}
            className={cn(
              "rounded-xl border p-4 text-left transition-all",
              state.goal === o.v
                ? "border-primary/50 bg-primary/10"
                : "border-border hover:border-border/70 hover:bg-accent/40",
            )}
          >
            <div className="font-medium">{o.title}</div>
            <div className="text-sm text-muted-foreground">{o.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepTraining({
  state,
  set,
}: {
  state: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const equipment = state.equipment ?? [];
  function toggle(item: string) {
    set(
      "equipment",
      equipment.includes(item)
        ? equipment.filter((e) => e !== item)
        : [...equipment, item],
    );
  }
  return (
    <div className="space-y-5">
      <Heading title="Training setup" subtitle="Where & how often you train." />
      <Field label="Experience">
        <Select
          value={state.experience ?? ""}
          onChange={(e) =>
            set("experience", e.target.value as FormState["experience"])
          }
        >
          <option value="">Select…</option>
          <option value="beginner">Beginner (&lt; 1 yr training)</option>
          <option value="intermediate">Intermediate (1–3 yrs)</option>
          <option value="advanced">Advanced (3+ yrs)</option>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Training location">
          <Select
            value={state.trainingLocation ?? ""}
            onChange={(e) =>
              set(
                "trainingLocation",
                e.target.value as FormState["trainingLocation"],
              )
            }
          >
            <option value="">Select…</option>
            <option value="gym">Gym</option>
            <option value="home">Home</option>
            <option value="both">Both</option>
          </Select>
        </Field>
        <Field label="Days per week">
          <Select
            value={state.trainingDaysPerWeek ?? ""}
            onChange={(e) =>
              set(
                "trainingDaysPerWeek",
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
          >
            <option value="">Select…</option>
            {[2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n} days
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Equipment available">
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((e) => {
            const on = equipment.includes(e);
            return (
              <button
                key={e}
                type="button"
                onClick={() => toggle(e)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  on
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent/40",
                )}
              >
                {e}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Injuries / limitations (optional)">
        <Textarea
          value={state.injuries ?? ""}
          onChange={(e) => set("injuries", e.target.value)}
          placeholder="e.g. mild lower back pain, left shoulder impingement"
        />
      </Field>
    </div>
  );
}

function StepDiet({
  state,
  set,
}: {
  state: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <Heading title="Diet preferences" subtitle="So meals match your reality." />
      <Field label="Food preference">
        <Select
          value={state.foodPref ?? ""}
          onChange={(e) => set("foodPref", e.target.value as FormState["foodPref"])}
        >
          <option value="">Select…</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="non_vegetarian">Non-vegetarian</option>
          <option value="eggetarian">Eggetarian (veg + eggs)</option>
          <option value="vegan">Vegan</option>
        </Select>
      </Field>
      <Field label="Diet style">
        <Select
          value={state.dietStyle ?? ""}
          onChange={(e) =>
            set("dietStyle", e.target.value as FormState["dietStyle"])
          }
        >
          <option value="">Select…</option>
          <option value="indian">Indian</option>
          <option value="western">Western</option>
          <option value="mixed">Mixed</option>
        </Select>
      </Field>
      <Field label="Budget">
        <div className="grid grid-cols-3 gap-2">
          {(["low", "medium", "high"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => set("budget", b)}
              className={cn(
                "rounded-xl border px-3 py-3 text-sm capitalize transition-colors",
                state.budget === b
                  ? "border-primary/50 bg-primary/10"
                  : "border-border hover:bg-accent/40",
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function StepMeasurements({
  state,
  set,
}: {
  state: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const m = state.measurements ?? {};
  const upd = (k: keyof NonNullable<FormState["measurements"]>, v: string) =>
    set("measurements", { ...m, [k]: v ? Number(v) : null });
  return (
    <div className="space-y-5">
      <Heading
        title="Optional measurements"
        subtitle="Skip if you don't have a tape — you can add later. All in cm."
      />
      <div className="grid grid-cols-2 gap-4">
        {([
          ["waistCm", "Waist"],
          ["chestCm", "Chest"],
          ["armsCm", "Arms"],
          ["thighsCm", "Thighs"],
          ["hipsCm", "Hips"],
          ["neckCm", "Neck"],
        ] as const).map(([k, label]) => (
          <Field key={k} label={label}>
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={m[k] ?? ""}
              onChange={(e) => upd(k, e.target.value)}
              placeholder="—"
            />
          </Field>
        ))}
      </div>
      <Badge variant="muted">You can skip this step.</Badge>
    </div>
  );
}

/* ---------------------------------------------------------------- helpers */

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function validateStep(step: number, s: FormState): string | null {
  if (step === 0) {
    if (!s.name?.trim()) return "Please enter your name.";
    if (!s.age || s.age < 13 || s.age > 99) return "Age must be 13–99.";
    if (!s.gender) return "Please choose a gender option.";
  }
  if (step === 1) {
    if (!s.heightCm || s.heightCm < 120 || s.heightCm > 230)
      return "Height in cm please (120–230).";
    if (!s.weightKg || s.weightKg < 35 || s.weightKg > 250)
      return "Weight in kg please (35–250).";
  }
  if (step === 2 && !s.goal) return "Pick a goal to continue.";
  if (step === 3) {
    if (!s.experience) return "Pick your experience level.";
    if (!s.trainingLocation) return "Where will you train?";
    if (!s.trainingDaysPerWeek) return "How many days per week?";
  }
  if (step === 4) {
    if (!s.foodPref) return "Pick your food preference.";
    if (!s.dietStyle) return "Pick a diet style.";
    if (!s.budget) return "Pick a budget level.";
  }
  return null;
}
