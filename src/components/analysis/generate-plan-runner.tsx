"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Salad, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STAGES = [
  { icon: Dumbbell, label: "Designing your training split…" },
  { icon: Dumbbell, label: "Picking exercises for your weak points…" },
  { icon: Dumbbell, label: "Calculating sets, reps, rest…" },
  { icon: Salad, label: "Building your diet around your macros…" },
  { icon: Salad, label: "Assembling your grocery list…" },
  { icon: Sparkles, label: "Final touches…" },
];

export function GeneratePlanRunner({ analysisId }: { analysisId?: string }) {
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setStage((s) => (s + 1) % STAGES.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch("/api/plan", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ analysisId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error ?? "Plan generation failed.");
        setDone(true);
        setTimeout(() => router.push("/dashboard"), 1200);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Plan generation failed.");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [analysisId, router]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-destructive">{error}</p>
          <Button
            onClick={() => router.push("/analysis")}
            className="mt-4"
            variant="outline"
          >
            Back to analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="card-glow border-primary/40">
        <CardContent className="flex flex-col items-center gap-3 p-12">
          <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          <div className="text-xl font-bold">Your plan is ready</div>
          <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
        </CardContent>
      </Card>
    );
  }

  const Icon = STAGES[stage].icon;

  return (
    <Card className="card-glow">
      <CardContent className="flex flex-col items-center gap-6 p-12 text-center">
        <motion.div
          animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 2.2, repeat: Infinity }}
          className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15 text-primary"
        >
          <Icon className="h-10 w-10" />
        </motion.div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Building your plan
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="mt-1 text-lg font-semibold"
            >
              {STAGES[stage].label}
            </motion.div>
          </AnimatePresence>
        </div>
        <p className="max-w-xs text-xs text-muted-foreground">
          Workout + diet are generating in parallel. Usually 30–60 seconds.
        </p>
      </CardContent>
    </Card>
  );
}
