"use client";

import * as React from "react";
import { Loader2, Save, DollarSign, UserCog } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LimitsConfig } from "@/lib/firestore/types";

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function LimitsEditor({ initial }: { initial: LimitsConfig }) {
  const [cfg, setCfg] = React.useState<LimitsConfig>(initial);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<{ type: "ok" | "error"; text: string } | null>(
    null,
  );

  function set<K extends keyof LimitsConfig>(key: K, value: number) {
    setCfg((p) => ({ ...p, [key]: value }));
  }

  // ---- live cost projection (per user, per month) ----
  const perGen = cfg.costPerGenerationUsd;
  const perMsg = cfg.costPerCoachMessageUsd;
  const monthlyGenCost = cfg.generationsPerMonth * perGen;
  const monthlyCoachCost = cfg.coachMessagesPerDay * 30 * perMsg;
  const totalMonthly = monthlyGenCost + monthlyCoachCost;

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "global", config: cfg }),
      });
      const data = await res.json().catch(() => ({}));
      setMsg(
        res.ok
          ? { type: "ok", text: "Limits saved — live across the site." }
          : { type: "error", text: data.error ?? `Failed (HTTP ${res.status})` },
      );
    } catch {
      setMsg({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Global limits (apply to every user)
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Generations / week"
              value={cfg.generationsPerWeek}
              onChange={(v) => set("generationsPerWeek", v)}
              hint="Rolling last 7 days"
            />
            <Field
              label="Generations / month"
              value={cfg.generationsPerMonth}
              onChange={(v) => set("generationsPerMonth", v)}
              hint="Rolling last 30 days"
            />
            <Field
              label="Coach messages / day"
              value={cfg.coachMessagesPerDay}
              onChange={(v) => set("coachMessagesPerDay", v)}
              hint="Rolling last 24 hours"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            One <strong>generation</strong> = a full analysis run (body analysis +
            body parts + workout + diet plan), counted once. The coach limit caps
            chat messages a user can send.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            Estimated API cost per generation / message
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Cost per generation (USD)"
              value={cfg.costPerGenerationUsd}
              onChange={(v) => set("costPerGenerationUsd", v)}
              step="0.001"
              hint="Anthropic cost for one full analysis + plan"
            />
            <Field
              label="Cost per coach message (USD)"
              value={cfg.costPerCoachMessageUsd}
              onChange={(v) => set("costPerCoachMessageUsd", v)}
              step="0.001"
              hint="Anthropic cost for one coach reply"
            />
          </div>

          {/* Projector */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <div className="mb-2 font-semibold">
              Projected worst-case cost per user / month
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <Row
                label={`${cfg.generationsPerMonth} generations × ${money(perGen)}`}
                value={money(monthlyGenCost)}
              />
              <Row
                label={`${cfg.coachMessagesPerDay}/day × 30 × ${money(perMsg)}`}
                value={money(monthlyCoachCost)}
              />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-base font-bold">
              <span>Max API cost / user / month</span>
              <span className="text-primary">{money(totalMonthly)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              1 generation costs ~{money(perGen)}. Allowing{" "}
              {cfg.generationsPerMonth} generations/month ={" "}
              {money(monthlyGenCost)} in plan generation alone.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save limits
        </Button>
        {msg && (
          <span
            className={
              msg.type === "ok"
                ? "text-sm text-emerald-400"
                : "text-sm text-destructive"
            }
          >
            {msg.text}
          </span>
        )}
      </div>

      <PerUserOverride />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  step = "1",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-muted-foreground">
      <span>{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

/**
 * Per-user override — paste a Firebase UID and set caps for just that user.
 * Leave a field blank to fall back to the global default for that user.
 */
function PerUserOverride() {
  const [uid, setUid] = React.useState("");
  const [week, setWeek] = React.useState("");
  const [month, setMonth] = React.useState("");
  const [day, setDay] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<{ type: "ok" | "error"; text: string } | null>(
    null,
  );

  async function save() {
    if (!uid.trim()) {
      setMsg({ type: "error", text: "Enter a user UID." });
      return;
    }
    setSaving(true);
    setMsg(null);
    const toNum = (s: string) => (s.trim() === "" ? null : Number(s));
    try {
      const res = await fetch("/api/admin/limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "user",
          uid: uid.trim(),
          limits: {
            generationsPerWeek: toNum(week),
            generationsPerMonth: toNum(month),
            coachMessagesPerDay: toNum(day),
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      setMsg(
        res.ok
          ? { type: "ok", text: "Override saved for this user." }
          : { type: "error", text: data.error ?? `Failed (HTTP ${res.status})` },
      );
    } catch {
      setMsg({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <UserCog className="h-4 w-4" />
          Per-user override
        </h2>
        <p className="text-xs text-muted-foreground">
          Set limits for a single user (find the UID on the Users page). Leave a
          field blank to use the global default for that field.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="ov-uid">User UID</Label>
          <Input
            id="ov-uid"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="e.g. a1B2c3D4..."
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Generations / week</Label>
            <Input
              type="number"
              min="0"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              placeholder="(global)"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Generations / month</Label>
            <Input
              type="number"
              min="0"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="(global)"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Coach messages / day</Label>
            <Input
              type="number"
              min="0"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              placeholder="(global)"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save override
          </Button>
          {msg && (
            <span
              className={
                msg.type === "ok"
                  ? "text-sm text-emerald-400"
                  : "text-sm text-destructive"
              }
            >
              {msg.text}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
