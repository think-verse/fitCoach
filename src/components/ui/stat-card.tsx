import * as React from "react";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  unit?: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "default" | "primary" | "warning" | "destructive";
}

export function StatCard({
  label,
  value,
  unit,
  hint,
  icon,
  tone = "default",
  className,
  ...props
}: StatCardProps) {
  const ring =
    tone === "primary"
      ? "ring-1 ring-primary/30"
      : tone === "warning"
        ? "ring-1 ring-amber-500/30"
        : tone === "destructive"
          ? "ring-1 ring-destructive/30"
          : "";
  return (
    <Card className={cn("relative overflow-hidden", ring, className)} {...props}>
      {icon && (
        <div className="absolute right-4 top-4 text-muted-foreground/40">{icon}</div>
      )}
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold tabular-nums">{value}</span>
          {unit && (
            <span className="text-sm text-muted-foreground font-medium">{unit}</span>
          )}
        </div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}
