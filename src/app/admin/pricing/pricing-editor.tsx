"use client";

import * as React from "react";
import { Plus, Trash2, Loader2, GripVertical, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { PricingTier } from "@/lib/firestore/types";

function emptyTier(): PricingTier {
  return {
    id: `tier_${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    priceLabel: "",
    amount: 0,
    currency: "USD",
    interval: "month",
    features: [],
    highlighted: false,
    active: true,
  };
}

export function PricingEditor({ initialTiers }: { initialTiers: PricingTier[] }) {
  const [tiers, setTiers] = React.useState<PricingTier[]>(
    initialTiers.length ? initialTiers : [emptyTier()],
  );
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  function update(index: number, patch: Partial<PricingTier>) {
    setTiers((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    );
  }

  function remove(index: number) {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }

  function add() {
    setTiers((prev) => [...prev, emptyTier()]);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiers }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "ok", text: "Pricing saved." });
      } else {
        setMessage({
          type: "error",
          text: data.error ?? `Failed (HTTP ${res.status})`,
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {tiers.map((tier, i) => (
        <Card key={tier.id}>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <GripVertical className="h-4 w-4" />
                Tier {i + 1}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(i)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`name-${tier.id}`}>Name</Label>
                <Input
                  id={`name-${tier.id}`}
                  value={tier.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder="Pro Monthly"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`id-${tier.id}`}>Tier ID</Label>
                <Input
                  id={`id-${tier.id}`}
                  value={tier.id}
                  onChange={(e) => update(i, { id: e.target.value })}
                  placeholder="pro_monthly"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`label-${tier.id}`}>Price label</Label>
                <Input
                  id={`label-${tier.id}`}
                  value={tier.priceLabel}
                  onChange={(e) => update(i, { priceLabel: e.target.value })}
                  placeholder="$9 / mo"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`interval-${tier.id}`}>Interval</Label>
                <Select
                  id={`interval-${tier.id}`}
                  value={tier.interval}
                  onChange={(e) =>
                    update(i, {
                      interval: e.target.value as PricingTier["interval"],
                    })
                  }
                >
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                  <option value="one_time">One-time</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`amount-${tier.id}`}>Amount</Label>
                <Input
                  id={`amount-${tier.id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={tier.amount}
                  onChange={(e) =>
                    update(i, { amount: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`currency-${tier.id}`}>Currency</Label>
                <Input
                  id={`currency-${tier.id}`}
                  value={tier.currency}
                  onChange={(e) =>
                    update(i, { currency: e.target.value.toUpperCase() })
                  }
                  placeholder="USD"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor={`features-${tier.id}`}>
                  Features (one per line)
                </Label>
                <textarea
                  id={`features-${tier.id}`}
                  className="flex min-h-24 w-full rounded-xl border border-input bg-input/40 px-4 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={tier.features.join("\n")}
                  onChange={(e) =>
                    update(i, {
                      features: e.target.value
                        .split("\n")
                        .map((f) => f.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder={"Unlimited analyses\nPriority support"}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border accent-primary"
                  checked={tier.highlighted}
                  onChange={(e) => update(i, { highlighted: e.target.checked })}
                />
                Highlighted
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border accent-primary"
                  checked={tier.active}
                  onChange={(e) => update(i, { active: e.target.checked })}
                />
                Active
              </label>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={add}>
          <Plus className="h-4 w-4" />
          Add tier
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save pricing
        </Button>
        {message && (
          <span
            className={
              message.type === "ok"
                ? "text-sm text-emerald-400"
                : "text-sm text-destructive"
            }
          >
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
