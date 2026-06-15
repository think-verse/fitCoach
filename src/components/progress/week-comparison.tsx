import {
  TrendingDown,
  TrendingUp,
  Minus,
  ArrowRight,
  ImageOff,
  Camera,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type Trend = "down" | "flat" | "up" | "unclear";

export interface AnglePair {
  angle: string;
  previousUrl: string | null;
  currentUrl: string | null;
}

export interface WeekComparisonProps {
  previousWeek: number;
  currentWeek: number;
  pairs: AnglePair[];
  fatTrend?: Trend | null;
  muscleTrend?: Trend | null;
  /** current minus previous, in display units (already converted). */
  weightDelta?: number | null;
  weightUnit?: string;
}

/**
 * Week-over-week visual comparison: the most recent prior week's photos beside
 * the current week's, plus per-metric trend bars from the AI weekly update.
 */
export function WeekComparison({
  previousWeek,
  currentWeek,
  pairs,
  fatTrend,
  muscleTrend,
  weightDelta,
  weightUnit = "kg",
}: WeekComparisonProps) {
  return (
    <Card className="card-glow overflow-hidden border-primary/20">
      <CardContent className="space-y-6 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">
              Your <span className="gradient-text">transformation</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              The change since your last full photo set.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1 text-xs font-medium">
            <span className="text-muted-foreground">Week {previousWeek}</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
            <span className="text-foreground">Week {currentWeek}</span>
          </div>
        </div>

        {/* Metric trend bars */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TrendBar label="Body fat" trend={fatTrend ?? "unclear"} metric="fat" />
          <TrendBar
            label="Muscle"
            trend={muscleTrend ?? "unclear"}
            metric="muscle"
          />
          <WeightBar delta={weightDelta ?? null} unit={weightUnit} />
        </div>

        {/* Side-by-side photos, per angle */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {pairs.map((p) => (
            <div key={p.angle} className="space-y-2">
              <div className="text-center text-xs font-medium capitalize text-muted-foreground">
                {p.angle}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <AnglePhoto url={p.previousUrl} weekLabel={`Wk ${previousWeek}`} />
                <AnglePhoto
                  url={p.currentUrl}
                  weekLabel={`Wk ${currentWeek}`}
                  highlight
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[10px] text-muted-foreground">
          Trends are AI visual estimates from your photos, not medical
          measurements.
        </p>
      </CardContent>
    </Card>
  );
}

function AnglePhoto({
  url,
  weekLabel,
  highlight,
}: {
  url: string | null;
  weekLabel: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[3/4] overflow-hidden rounded-xl border bg-muted/30",
        highlight ? "border-primary/40" : "border-border",
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`${weekLabel} progress photo`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground/60">
          <ImageOff className="h-5 w-5" />
          <span className="text-[10px]">No photo</span>
        </div>
      )}
      <span
        className={cn(
          "absolute bottom-1 left-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium backdrop-blur",
          highlight
            ? "bg-primary/80 text-primary-foreground"
            : "bg-background/70 text-muted-foreground",
        )}
      >
        {weekLabel}
      </span>
    </div>
  );
}

function trendVisual(trend: Trend, metric: "fat" | "muscle") {
  const goodDir = metric === "fat" ? "down" : "up";
  const badDir = metric === "fat" ? "up" : "down";

  if (trend === goodDir) {
    return {
      Icon: metric === "fat" ? TrendingDown : TrendingUp,
      caption: metric === "fat" ? "Trending down" : "Building",
      text: "text-emerald-400",
      fill: "from-emerald-400 to-teal-300",
      pct: 78,
    };
  }
  if (trend === badDir) {
    return {
      Icon: metric === "fat" ? TrendingUp : TrendingDown,
      caption: metric === "fat" ? "Trending up" : "Slipping",
      text: "text-amber-500",
      fill: "from-amber-400 to-red-400",
      pct: 72,
    };
  }
  if (trend === "flat") {
    return {
      Icon: Minus,
      caption: "Holding steady",
      text: "text-muted-foreground",
      fill: "from-muted-foreground/50 to-muted-foreground/50",
      pct: 45,
    };
  }
  return {
    Icon: Minus,
    caption: "Not enough data",
    text: "text-muted-foreground",
    fill: "from-muted-foreground/40 to-muted-foreground/40",
    pct: 22,
  };
}

function TrendBar({
  label,
  trend,
  metric,
}: {
  label: string;
  trend: Trend;
  metric: "fat" | "muscle";
}) {
  const v = trendVisual(trend, metric);
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <v.Icon className={cn("h-4 w-4", v.text)} />
      </div>
      <div className={cn("mt-1 text-sm font-semibold", v.text)}>{v.caption}</div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r", v.fill)}
          style={{ width: `${v.pct}%` }}
        />
      </div>
    </div>
  );
}

function WeightBar({ delta, unit }: { delta: number | null; unit: string }) {
  const has = delta !== null && Number.isFinite(delta);
  const down = has && delta! < 0;
  const up = has && delta! > 0;
  const text = down
    ? "text-emerald-400"
    : up
      ? "text-foreground"
      : "text-muted-foreground";
  const Icon = down ? TrendingDown : up ? TrendingUp : Minus;
  const caption = has
    ? `${delta! > 0 ? "+" : ""}${delta!.toFixed(1)} ${unit}`
    : "No weight logged";

  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Weight
        </span>
        <Icon className={cn("h-4 w-4", text)} />
      </div>
      <div className={cn("mt-1 text-sm font-semibold", text)}>{caption}</div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
        <Camera className="h-3 w-3" />
        vs last check-in
      </div>
    </div>
  );
}
