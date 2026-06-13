import { Card, CardContent } from "@/components/ui/card";
import { requireAdminPage } from "../guard";
import { PageHeader, formatDate } from "../ui";
import { getPricing } from "@/lib/firestore/repo";
import type { PricingTier } from "@/lib/firestore/types";
import { PricingEditor } from "./pricing-editor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  requireAdminPage();

  let tiers: PricingTier[] = [];
  let updatedAt: string | null = null;
  let error: string | null = null;
  try {
    const pricing = await getPricing();
    if (pricing) {
      tiers = pricing.tiers ?? [];
      updatedAt = pricing.updatedAt ?? null;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load pricing";
  }

  return (
    <div>
      <PageHeader
        title="Pricing"
        description={
          updatedAt
            ? `Last updated ${formatDate(updatedAt)}`
            : "Configure the subscription tiers shown on the pricing page."
        }
      />

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">
            Could not load pricing: {error}
          </CardContent>
        </Card>
      ) : (
        <PricingEditor initialTiers={tiers} />
      )}
    </div>
  );
}
