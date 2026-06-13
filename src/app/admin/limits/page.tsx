import { Card, CardContent } from "@/components/ui/card";
import { requireAdminPage } from "../guard";
import { PageHeader, formatDate } from "../ui";
import { getLimitsConfig, DEFAULT_LIMITS } from "@/lib/firestore/repo";
import type { LimitsConfig } from "@/lib/firestore/types";
import { LimitsEditor } from "./limits-editor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLimitsPage() {
  requireAdminPage();

  let config: LimitsConfig = DEFAULT_LIMITS;
  let updatedAt: string | null = null;
  let error: string | null = null;
  try {
    config = await getLimitsConfig();
    updatedAt = config.updatedAt ?? null;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load limits";
  }

  return (
    <div>
      <PageHeader
        title="Usage limits"
        description={
          updatedAt
            ? `Last updated ${formatDate(updatedAt)} — changes apply live to the whole site.`
            : "Control how many generations and coach messages each user gets. Applies live across the site."
        }
      />

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">
            Could not load limits: {error}
          </CardContent>
        </Card>
      ) : (
        <LimitsEditor initial={config} />
      )}
    </div>
  );
}
