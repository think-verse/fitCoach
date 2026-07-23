"use client";

import { useState, useTransition } from "react";
import { Loader2, LogOut, RotateCcw, Save, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  deleteAccount,
  resetAccount,
  signOut,
  updateProfile,
} from "@/app/actions/account";
import type { UserProfile, Subscription } from "@/lib/firestore/types";

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

export function SettingsForm({
  profile,
  subscription,
  email,
}: {
  profile: UserProfile;
  subscription: Subscription | null;
  email: string | null;
}) {
  const [form, setForm] = useState({
    goal: profile.goal ?? "general_fitness",
    experience: (profile.experience ?? "beginner") as
      | "beginner"
      | "intermediate"
      | "advanced",
    trainingLocation: (profile.trainingLocation ?? "gym") as
      | "gym"
      | "home"
      | "both",
    equipment: (profile.equipment ?? []) as string[],
    trainingDaysPerWeek: profile.trainingDaysPerWeek ?? 4,
    foodPref: profile.foodPref ?? "non_vegetarian",
    // Legacy 'indian' value (no longer offered) falls back to 'mixed' so the
    // form Select has a valid option and a save doesn't fail Zod validation.
    dietStyle: (profile.dietStyle === ("indian" as unknown as typeof profile.dietStyle)
      ? "mixed"
      : (profile.dietStyle ?? "mixed")) as "western" | "mixed",
    activityLevel: (profile.activityLevel ?? "moderate") as
      | "sedentary"
      | "light"
      | "moderate"
      | "active"
      | "very_active",
    injuries: profile.injuries ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  function save() {
    setSaved(false);
    startTransition(async () => {
      await updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold">Account</h3>
          <div className="mt-3 space-y-2 text-sm">
            <Row label="Email" value={email ?? "—"} />
            <Row label="Name" value={profile.name ?? "—"} />
            <Row
              label="Subscription"
              value={
                <Badge
                  variant={subscription?.tier === "free" ? "muted" : "success"}
                >
                  {subscription?.tier?.replace("_", " ") ?? "free"}
                </Badge>
              }
            />
          </div>
          <form action={signOut} className="mt-4">
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h3 className="text-lg font-semibold">Plan preferences</h3>
          <p className="text-xs text-muted-foreground">
            Updating these doesn't auto-regenerate your plan. Re-run analysis or
            a check-in to apply changes.
          </p>

          <Field label="Goal">
            <Select
              value={form.goal}
              onChange={(e) =>
                setForm((f) => ({ ...f, goal: e.target.value as typeof f.goal }))
              }
            >
              <option value="fat_loss">Fat loss</option>
              <option value="muscle_gain">Muscle gain</option>
              <option value="recomposition">Recomposition</option>
              <option value="strength">Strength</option>
              <option value="general_fitness">General fitness</option>
            </Select>
          </Field>

          <Field label="Experience level">
            <Select
              value={form.experience}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  experience: e.target.value as typeof f.experience,
                }))
              }
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </Field>

          <Field label="Training location">
            <Select
              value={form.trainingLocation}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  trainingLocation: e.target.value as typeof f.trainingLocation,
                }))
              }
            >
              <option value="gym">Gym</option>
              <option value="home">Home</option>
              <option value="both">Both</option>
            </Select>
          </Field>

          <Field label="Equipment available">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {EQUIPMENT_OPTIONS.map((item) => {
                const on = form.equipment.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        equipment: on
                          ? f.equipment.filter((e) => e !== item)
                          : [...f.equipment, item],
                      }))
                    }
                    className={
                      "rounded-lg border px-3 py-2 text-left text-xs transition-colors " +
                      (on
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background/40 text-muted-foreground hover:border-primary/40")
                    }
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Training days / week">
            <Select
              value={form.trainingDaysPerWeek}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  trainingDaysPerWeek: Number(e.target.value),
                }))
              }
            >
              {[2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n} days
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Daily activity (outside training)">
            <Select
              value={form.activityLevel}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  activityLevel: e.target.value as typeof f.activityLevel,
                }))
              }
            >
              <option value="sedentary">Sedentary — desk job, little walking</option>
              <option value="light">Light — some walking, light chores</option>
              <option value="moderate">Moderate — daily walking + chores</option>
              <option value="active">Active — on feet most of the day</option>
              <option value="very_active">
                Very active — physical / manual labor job
              </option>
            </Select>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Don&rsquo;t count gym sessions here. Most desk workers who train
              4–5×/week are <span className="text-foreground">light</span> or{" "}
              <span className="text-foreground">moderate</span>. Picking{" "}
              &ldquo;very active&rdquo; inflates your calorie target by
              ~30%.
            </p>
          </Field>

          <Field label="Food preference">
            <Select
              value={form.foodPref}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  foodPref: e.target.value as typeof f.foodPref,
                }))
              }
            >
              <option value="vegetarian">Vegetarian</option>
              <option value="non_vegetarian">Non-vegetarian</option>
              <option value="eggetarian">Eggetarian</option>
              <option value="vegan">Vegan</option>
            </Select>
          </Field>

          <Field label="Diet style">
            <Select
              value={form.dietStyle}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  dietStyle: e.target.value as typeof f.dietStyle,
                }))
              }
            >
              <option value="western">Western</option>
              <option value="mixed">Mixed / international</option>
            </Select>
          </Field>

          <Field label="Injuries / limitations">
            <Textarea
              value={form.injuries}
              onChange={(e) => setForm((f) => ({ ...f, injuries: e.target.value }))}
            />
          </Field>

          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </Button>
            {saved && (
              <span className="text-xs text-emerald-400">Saved.</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30">
        <CardContent className="space-y-3 p-6">
          <h3 className="text-lg font-semibold text-amber-400">Start over</h3>
          <p className="text-sm text-muted-foreground">
            Wipe your profile, photos, plans, check-ins, and chat history — but
            keep your account &amp; sign-in. You&rsquo;ll be sent back to
            onboarding to set everything up fresh. Useful for testing the flow
            or starting clean.
          </p>
          {confirmingReset ? (
            <div className="flex flex-wrap gap-2">
              <form action={resetAccount}>
                <Button
                  type="submit"
                  variant="outline"
                  className="border-amber-500/50 text-amber-400"
                >
                  <RotateCcw className="h-4 w-4" /> Yes, reset my data
                </Button>
              </form>
              <Button onClick={() => setConfirmingReset(false)} variant="ghost">
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setConfirmingReset(true)}
              variant="outline"
              className="border-amber-500/40 text-amber-400"
            >
              <RotateCcw className="h-4 w-4" /> Reset my data
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardContent className="space-y-3 p-6">
          <h3 className="text-lg font-semibold text-destructive">Danger zone</h3>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account, all photos, plans, and history.
            This cannot be undone.
          </p>
          {confirmingDelete ? (
            <div className="flex flex-wrap gap-2">
              <form action={deleteAccount}>
                <Button type="submit" variant="destructive">
                  <Trash2 className="h-4 w-4" /> Yes, delete everything
                </Button>
              </form>
              <Button onClick={() => setConfirmingDelete(false)} variant="ghost">
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setConfirmingDelete(true)}
              variant="outline"
              className="border-destructive/40 text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Delete my account
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
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
