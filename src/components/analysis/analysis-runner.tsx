"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AnalysisView } from "./analysis-view";
import type { BodyAnalysis } from "@/lib/ai/schemas";

interface NutritionPayload {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const STAGES = [
  "Looking at your photos…",
  "Estimating body composition…",
  "Calculating BMI / BMR / TDEE…",
  "Mapping priority muscle groups…",
  "Writing your analysis…",
];

export function AnalysisRunner() {
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    | {
        id: string;
        analysis: BodyAnalysis;
        nutrition: NutritionPayload;
      }
    | null
  >(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((s) => Math.min(STAGES.length - 1, s + 1));
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  // Guard against React strict-mode double-invoke (dev) and re-renders firing a
  // second expensive analysis. The analysis must run exactly once per mount.
  const startedRef = useRef(false);

  useEffect(() => {
    // startedRef already guarantees exactly one run across Strict-Mode
    // remounts, so we must NOT also use a cleanup "cancelled" flag — that flag
    // would cancel the single in-flight request and the result (which arrives
    // after the remount) would be discarded, leaving the spinner stuck forever.
    if (startedRef.current) return;
    startedRef.current = true;

    async function callOnce(): Promise<Response> {
      return fetch("/api/analysis", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ weekNumber: 0 }),
      });
    }

    async function run() {
      // Up to 2 attempts to ride out cold-start / transient timeouts.
      const MAX_ATTEMPTS = 2;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const res = await callOnce();
          const retryable =
            !res.ok && res.status >= 500 && attempt < MAX_ATTEMPTS;
          if (retryable) {
            await new Promise((r) => setTimeout(r, 2500));
            continue;
          }
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Analysis failed.");
          setResult(data);
          return;
        } catch (e) {
          if (attempt < MAX_ATTEMPTS) {
            await new Promise((r) => setTimeout(r, 2500));
            continue;
          }
          setError(e instanceof Error ? e.message : "Analysis failed.");
        }
      }
    }
    run();
  }, []);

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-destructive">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            If you haven't configured ANTHROPIC_API_KEY yet, see the README. You
            can still browse the rest of the app — your photos are saved.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="card-glow">
        <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-lg font-semibold">{STAGES[stage]}</div>
          <p className="max-w-md text-sm text-muted-foreground">
            This usually takes 20–40 seconds. Don't close this tab.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <AnalysisView
      analysisId={result.id}
      analysis={result.analysis}
      nutrition={result.nutrition}
    />
  );
}
