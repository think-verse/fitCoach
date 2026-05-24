"use client";

import { useState, useTransition } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveCheckin } from "@/app/actions/checkin";
import type { CheckinInput } from "@/lib/validation/schemas";
import type { WeeklyUpdate } from "@/lib/ai/schemas";

interface Props {
  defaultWeek: number;
}

export function CheckinForm({ defaultWeek }: Props) {
  const [form, setForm] = useState<CheckinInput>({
    weightKg: undefined,
    workoutAdherencePct: 80,
    dietAdherencePct: 80,
  });
  const [error, setError] = useState<string | null>(null);
  const [update, setUpdate] = useState<WeeklyUpdate | null>(null);
  const [isPending, startTransition] = useTransition();

  function upd<K extends keyof CheckinInput>(k: K, v: CheckinInput[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const { weekNumber } = await saveCheckin(form, defaultWeek);
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ weekNumber }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "AI comparison failed.");
        setUpdate(data.update as WeeklyUpdate);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Check-in failed.");
      }
    });
  }

  if (update) {
    return <UpdateView update={update} />;
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Week {defaultWeek} check-in</h2>
          <p className="text-sm text-muted-foreground">
            Log weight, optional measurements, and how the week went.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Weight (kg)">
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

        <div className="pt-2 text-xs text-muted-foreground">
          Upload new photos via the section below before submitting — they help the
          AI compare your progress.
        </div>

        <Button onClick={submit} size="lg" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Comparing your week…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Submit check-in
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function UpdateView({ update }: { update: WeeklyUpdate }) {
  return (
    <Card className="card-glow border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <Badge variant="success">AI weekly update</Badge>
          <Badge variant="muted">Confidence: {update.confidence_level}</Badge>
        </div>
        <p className="text-sm leading-relaxed">{update.progress_summary}</p>

        <div className="grid gap-4 md:grid-cols-2">
          <BulletBox title="What improved" items={update.what_improved} tone="success" />
          <BulletBox
            title="Still to work on"
            items={update.what_did_not_improve}
            tone="warning"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Mini label="Fat trend" value={update.estimated_fat_trend} />
          <Mini label="Muscle trend" value={update.estimated_muscle_trend} />
          <Mini
            label="Calorie adjust"
            value={
              update.calorie_adjustment_kcal === 0
                ? "hold"
                : `${update.calorie_adjustment_kcal > 0 ? "+" : ""}${
                    update.calorie_adjustment_kcal
                  } kcal/day`
            }
          />
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Workout adjustment
          </div>
          <div className="mt-1">{update.workout_adjustment}</div>
        </div>

        <BulletBox title="Next week focus" items={update.next_week_focus} />

        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm italic">
          {update.motivation_message}
        </div>
      </CardContent>
    </Card>
  );
}

function BulletBox({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: "success" | "warning";
}) {
  const dot =
    tone === "success"
      ? "bg-emerald-400"
      : tone === "warning"
        ? "bg-amber-400"
        : "bg-muted-foreground/60";
  if (!items.length) return null;
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <ul className="space-y-1.5 text-sm">
        {items.map((i, n) => (
          <li key={n} className="flex gap-2">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold capitalize">{value}</div>
    </div>
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
