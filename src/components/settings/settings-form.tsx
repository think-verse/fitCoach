"use client";

import { useState, useTransition } from "react";
import { Loader2, LogOut, Save, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  deleteAccount,
  signOut,
  updateProfile,
} from "@/app/actions/account";
import type { UserProfile, Subscription } from "@/lib/db/schema";

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
    trainingDaysPerWeek: profile.trainingDaysPerWeek ?? 4,
    foodPref: profile.foodPref ?? "non_vegetarian",
    // Legacy 'indian' value (no longer offered) falls back to 'mixed' so the
    // form Select has a valid option and a save doesn't fail Zod validation.
    dietStyle: (profile.dietStyle === ("indian" as unknown as typeof profile.dietStyle)
      ? "mixed"
      : (profile.dietStyle ?? "mixed")) as "western" | "mixed",
    injuries: profile.injuries ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
