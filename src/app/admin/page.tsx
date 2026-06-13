import Link from "next/link";
import {
  Users,
  Crown,
  UserMinus,
  Activity,
  BarChart3,
  Tag,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdminPage } from "./guard";
import { PageHeader } from "./ui";
import { getUsageStats } from "@/lib/admin/data";
import { queueStats } from "@/lib/ai/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QUICK_LINKS = [
  { href: "/admin/users", label: "Manage users", icon: Users },
  { href: "/admin/usage", label: "Usage stats", icon: BarChart3 },
  { href: "/admin/health", label: "API health", icon: Activity },
  { href: "/admin/pricing", label: "Edit pricing", icon: Tag },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
];

export default async function AdminOverviewPage() {
  requireAdminPage();

  let stats = {
    totalUsers: 0,
    paidUsers: 0,
    freeUsers: 0,
    totalAnalyses: 0,
    totalCheckins: 0,
  };
  let statsError: string | null = null;
  try {
    stats = await getUsageStats();
  } catch (e) {
    statsError = e instanceof Error ? e.message : "Failed to load stats";
  }
  const queue = queueStats();

  return (
    <div>
      <PageHeader
        title="Overview"
        description="At-a-glance health of the FitCoach platform."
      />

      {statsError && (
        <Card className="mb-6 border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">
            Could not load user stats: {statsError}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={stats.totalUsers}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Paid users"
          value={stats.paidUsers}
          tone="primary"
          icon={<Crown className="h-5 w-5" />}
        />
        <StatCard
          label="Free users"
          value={stats.freeUsers}
          icon={<UserMinus className="h-5 w-5" />}
        />
        <StatCard
          label="AI queue"
          value={`${queue.active}/${queue.maxConcurrency}`}
          hint={`${queue.queued} queued`}
          tone={queue.queued > 0 ? "warning" : "default"}
          icon={<Activity className="h-5 w-5" />}
        />
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Quick links
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="transition-colors hover:border-primary/50">
              <CardContent className="flex items-center justify-between p-4">
                <span className="flex items-center gap-3 text-sm font-medium">
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
