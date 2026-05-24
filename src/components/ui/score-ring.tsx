import * as React from "react";
import { cn } from "@/lib/utils";

interface ScoreRingProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0–100
  label?: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
}

export function ScoreRing({
  value,
  label,
  sublabel,
  size = 96,
  strokeWidth = 8,
  className,
  ...props
}: ScoreRingProps) {
  const safe = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;
  const color =
    safe >= 75
      ? "stroke-emerald-400"
      : safe >= 50
        ? "stroke-amber-400"
        : "stroke-rose-400";

  return (
    <div className={cn("flex flex-col items-center gap-1", className)} {...props}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-muted fill-none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn("fill-none transition-all duration-1000", color)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold tabular-nums">{Math.round(safe)}</span>
        </div>
      </div>
      {label && <div className="text-xs font-medium text-center">{label}</div>}
      {sublabel && (
        <div className="text-[10px] text-muted-foreground text-center">{sublabel}</div>
      )}
    </div>
  );
}
