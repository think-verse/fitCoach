import { Card, CardContent } from "@/components/ui/card";
import { requireAdminPage } from "../guard";
import { PageHeader } from "../ui";
import { listErrorLogs } from "@/lib/firestore/repo";
import type { ErrorLogEntry } from "@/lib/firestore/types";
import { ErrorLogList } from "./error-log-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminErrorsPage() {
  requireAdminPage();

  let logs: ErrorLogEntry[] = [];
  let error: string | null = null;
  try {
    logs = await listErrorLogs(200);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load error logs";
  }

  return (
    <div>
      <PageHeader
        title="Error logs"
        description="Real server-side errors (Firebase, Anthropic, etc.). Users never see these — they get a generic message."
      />

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">
            Could not load error logs: {error}
          </CardContent>
        </Card>
      ) : (
        <ErrorLogList initial={logs} />
      )}
    </div>
  );
}
