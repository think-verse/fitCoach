import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getLatestAnalysis } from "@/lib/firestore/repo";
import { AnalysisRunner } from "@/components/analysis/analysis-runner";
import { AnalysisView } from "@/components/analysis/analysis-view";
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

        {shouldRunFresh ? (
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
