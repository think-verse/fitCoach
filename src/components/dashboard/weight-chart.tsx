"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceArea,
} from "recharts";

interface Point {
  date: string;
  weight: number;
}

interface WeightChartProps {
  data: Point[];
  /** Healthy weight band (BMI 18.5–24.9) shaded behind the line. */
  healthyMin?: number | null;
  healthyMax?: number | null;
  /** Display unit label for the tooltip (e.g. "kg" / "lb"). */
  unit?: string;
}

export function WeightChart({
  data,
  healthyMin,
  healthyMax,
  unit = "kg",
}: WeightChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Log a weight to see your trend.
      </div>
    );
  }
  const hasBand =
    healthyMin != null &&
    healthyMax != null &&
    Number.isFinite(healthyMin) &&
    Number.isFinite(healthyMax);

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[
              (dataMin: number) =>
                Math.floor(Math.min(dataMin, hasBand ? healthyMin! : dataMin) - 1),
              (dataMax: number) =>
                Math.ceil(Math.max(dataMax, hasBand ? healthyMax! : dataMax) + 1),
            ]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          {hasBand && (
            <ReferenceArea
              y1={healthyMin!}
              y2={healthyMax!}
              fill="hsl(var(--primary))"
              fillOpacity={0.08}
              stroke="hsl(var(--primary))"
              strokeOpacity={0.25}
              strokeDasharray="3 3"
              ifOverflow="extendDomain"
            />
          )}
          <Tooltip
            formatter={(value: number | string) => [`${value} ${unit}`, "Weight"]}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "hsl(var(--primary))" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
