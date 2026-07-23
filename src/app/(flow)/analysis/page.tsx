import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getLatestAnalysis } from "@/lib/firestore/repo";
import { checkGenerationAllowed } from "@/lib/limits/limits";
import { AnalysisRunner } from "@/components/analysis/analysis-runner";
import { AnalysisView } from "@/components/analysis/analysis-view";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BodyAnalysis } from "@/lib/ai/schemas";

export const metadata = { title: "Your AI body analysis" };

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: { fresh?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // If we already have an analysis and the user didn't just upload fresh photos,
  // show the latest. Otherwise, run a new one.
  const latest = await getLatestAnalysis(user.id).catch(() => null);

  const shouldRunFresh = searchParams.fresh === "1" || !latest;

  // Gate the generation cap HERE — before mounting AnalysisRunner — so an
  // out-of-quota user who just uploaded photos sees a clear "limit reached"
  // message instead of the runner firing /api/analysis and bouncing off the
  // 429. The server route keeps its own check as the authoritative backstop.
  const gate = shouldRunFresh ? await checkGenerationAllowed(user.id) : null;

  return (
    <div className="min-h-dvh bg-hero-glow px-4 py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Your <span className="gradient-text">AI body analysis</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visual estimate from your photos + math from your profile.
          </p>
        </header>

        {shouldRunFresh && gate && !gate.allowed ? (
          <Card>
            <CardContent className="space-y-4 p-8 text-center">
              <p className="text-lg font-semibold">You&apos;re out of generations</p>
              <p className="text-sm text-muted-foreground">{gate.reason}</p>
              <p className="text-sm text-muted-foreground">
                Your uploaded photos are saved — they&apos;ll be ready when your
                limit resets.
              </p>
              <Button asChild>
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : shouldRunFresh ? (
          <AnalysisRunner />
        ) : (
          <AnalysisView
            analysisId={latest.id}
            analysis={latest.report as BodyAnalysis}
            nutrition={{
              bmi: Number(latest.bmi ?? 0),
              bmiCategory: latest.bmiCategory ?? "",
              bmr: latest.bmr ?? 0,
              tdee: latest.tdee ?? 0,
              targetCalories: latest.targetCalories ?? 0,
              proteinG: latest.proteinG ?? 0,
              carbsG: latest.carbsG ?? 0,
              fatG: latest.fatG ?? 0,
            }}
          />
        )}
      </div>
    </div>
  );
}
