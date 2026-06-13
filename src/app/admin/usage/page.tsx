import { Users, Crown, UserMinus, ScanFace, ClipboardCheck } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdminPage } from "../guard";
import { PageHeader } from "../ui";
import { getUsageStats } from "@/lib/admin/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminUsagePage() {
  requireAdminPage();

  let error: string | null = null;
  let stats = {
    totalUsers: 0,
    paidUsers: 0,
    freeUsers: 0,
    totalAnalyses: 0,
    totalCheckins: 0,
  };
  try {
    stats = await getUsageStats();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load usage stats";
  }

  const conversion =
    stats.totalUsers > 0
      ? `${Math.round((stats.paidUsers / stats.totalUsers) * 100)}%`
      : "—";

  return (
    <div>
      <PageHeader
        title="Usage"
        description="Platform-wide aggregate counts (computed live across all users)."
      />

      {error && (
        <Card className="mb-6 border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">
            Could not load usage stats: {error}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Total users"
          value={stats.totalUsers}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Paid users"
          value={stats.paidUsers}
          hint={`${conversion} conversion`}
          tone="primary"
          icon={<Crown className="h-5 w-5" />}
        />
        <StatCard
          label="Free users"
          value={stats.freeUsers}
          icon={<UserMinus className="h-5 w-5" />}
        />
        <StatCard
          label="Body analyses"
          value={stats.totalAnalyses}
          hint="across all users"
          icon={<ScanFace className="h-5 w-5" />}
        />
        <StatCard
          label="Weekly check-ins"
          value={stats.totalCheckins}
          hint="across all users"
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}
