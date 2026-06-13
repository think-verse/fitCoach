import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/auth";
import { GeneratePlanRunner } from "@/components/analysis/generate-plan-runner";

export const metadata = { title: "Generating your plan" };

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: { analysisId?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="min-h-dvh bg-hero-glow px-4 py-12 md:py-20">
      <div className="mx-auto max-w-xl text-center">
        <GeneratePlanRunner analysisId={searchParams.analysisId} />
      </div>
    </div>
  );
}
