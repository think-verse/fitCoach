import * as React from "react";
import { Badge } from "@/components/ui/badge";

/** Page header used across admin screens. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

const PAID_TIERS = new Set(["pro_monthly", "pro_yearly", "lifetime"]);

/** Coloured badge for a subscription tier. */
export function TierBadge({ tier }: { tier: string }) {
  if (tier === "unknown") {
    return <Badge variant="muted">unknown</Badge>;
  }
  if (PAID_TIERS.has(tier)) {
    return <Badge variant="success">{tier.replace(/_/g, " ")}</Badge>;
  }
  return <Badge variant="muted">free</Badge>;
}

/** Format an ISO / RFC date string for display; em-dash if absent. */
export function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
