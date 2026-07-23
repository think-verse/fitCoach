"use client";

import { useState, useTransition } from "react";
import { Loader2, Send, CheckCircle2, Dumbbell, Salad, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveCheckin } from "@/app/actions/checkin";
import type { CheckinInput } from "@/lib/validation/schemas";

interface Props {
  defaultWeek: number;
  weightUnit?: string;
}

/**
 * Weekly check-in — a FREE, direct DB write. It logs weight / measurements /
 * adherence and updates the progress graph. It does NOT call the AI and is NOT
 * rate-limited, so the user can check in as often as they like. The AI photo
 * comparison (which costs a generation) is a separate flow in the photos
 * section above.
 */
export function CheckinForm({ defaultWeek, weightUnit = "kg" }: Props) {
  const [form, setForm] = useState<CheckinInput>({
    weightKg: undefined,
    workoutAdherencePct: 80,
    dietAdherencePct: 80,
  });
  const [error, setError] = useState<string | null>(null);
  const [savedWeek, setSavedWeek] = useState<number | null>(null);
  const [savedWeight, setSavedWeight] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function upd<K extends keyof CheckinInput>(k: K, v: CheckinInput[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const { weekNumber } = await saveCheckin(form, defaultWeek);
        setSavedWeek(weekNumber);
        setSavedWeight(form.weightKg ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Check-in failed.");
      }
    });
  }

  function logAnother() {
    setSavedWeek(null);
    setSavedWeight(null);
    setForm({ weightKg: undefined, workoutAdherencePct: 80, dietAdherencePct: 80 });
  }

  if (savedWeek != null) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight">
            Check-in saved
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            {savedWeight != null
              ? `Logged ${savedWeight} ${weightUnit} for week ${savedWeek}. Your progress graph is updated.`
              : `Week ${savedWeek} check-in is logged. Your progress graph is updated.`}
          </p>
          <Button onClick={logAnother} variant="outline" className="mt-6">
            <Plus className="h-4 w-4" /> Log another check-in
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Want AI to read your progress? Upload a photo set above and run the
            photo analysis — that&apos;s the part that uses your plan limit.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">Week {defaultWeek} check-in</h2>
            <p className="text-sm text-muted-foreground">
              Log weight, optional measurements, and how the week went.
            </p>
          </div>
          <Badge variant="success">Free · no limit</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label={`Weight (${weightUnit})`}>
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={form.weightKg ?? ""}
              onChange={(e) =>
                upd("weightKg", e.target.value ? Number(e.target.value) : null)
              }
              placeholder="72.5"
            />
          </Field>
          <Field label="Waist (cm)">
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={form.waistCm ?? ""}
              onChange={(e) =>
                upd("waistCm", e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <Field label="Chest (cm)">
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={form.chestCm ?? ""}
              onChange={(e) =>
                upd("chestCm", e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <Field label="Arms (cm)">
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={form.armsCm ?? ""}
              onChange={(e) =>
                upd("armsCm", e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
        </div>

        <div className="space-y-3">
          <SliderField
            label={`Workout adherence — ${form.workoutAdherencePct ?? 0}%`}
            value={form.workoutAdherencePct ?? 80}
            onChange={(v) => upd("workoutAdherencePct", v)}
          />
          <SliderField
            label={`Diet adherence — ${form.dietAdherencePct ?? 0}%`}
            value={form.dietAdherencePct ?? 80}
            onChange={(v) => upd("dietAdherencePct", v)}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Salad className="h-3 w-3 text-primary" /> Saved straight to your log
          </span>
          <span className="inline-flex items-center gap-1">
            <Dumbbell className="h-3 w-3 text-primary" /> No AI, no limit
          </span>
        </div>

        <Button onClick={submit} size="lg" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Save check-in
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-500"
      />
    </div>
  );
}
