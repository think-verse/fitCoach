import { CheckCircle2, XCircle, Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { requireAdminPage } from "../guard";
import { PageHeader } from "../ui";
import { queueStats } from "@/lib/ai/queue";
import { AnthropicPing } from "./ping-button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ConfigRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm">{label}</span>
      {ok ? (
        <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" /> Configured
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
          <XCircle className="h-4 w-4" /> Missing
        </span>
      )}
    </div>
  );
}

export default function AdminHealthPage() {
  requireAdminPage();

  const queue = queueStats();
  const config = {
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    firebaseAdmin: Boolean(
      process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY,
    ),
  };

  return (
    <div>
      <PageHeader
        title="API Health"
        description="Are external APIs configured/up, and how deep is the AI queue?"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Active AI calls"
          value={queue.active}
          hint={`max ${queue.maxConcurrency} concurrent`}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label="Queued"
          value={queue.queued}
          tone={queue.queued > 0 ? "warning" : "default"}
          hint="waiting for a slot"
        />
        <StatCard
          label="Max concurrency"
          value={queue.maxConcurrency}
          hint="per server instance"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">External services</CardTitle>
            <p className="text-sm text-muted-foreground">
              Whether the required environment variables are present (not whether
              the values are valid).
            </p>
          </CardHeader>
          <CardContent className="divide-y divide-border/50 pt-0">
            <ConfigRow label="Anthropic (AI)" ok={config.anthropic} />
            <ConfigRow label="Firebase Admin" ok={config.firebaseAdmin} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reachability check</CardTitle>
            <p className="text-sm text-muted-foreground">
              Pings api.anthropic.com to confirm it&apos;s up. This spends no
              tokens — any HTTP response counts as reachable.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <AnthropicPing />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
