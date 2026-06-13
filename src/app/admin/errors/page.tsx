import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireAdminPage } from "../guard";
import { PageHeader, formatDate } from "../ui";
import { listErrorLogs } from "@/lib/firestore/repo";
import type { ErrorLogEntry } from "@/lib/firestore/types";

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
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No errors logged. 🎉
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted">{log.context}</Badge>
                  {log.code && <Badge variant="success">{log.code}</Badge>}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDate(log.createdAt)}
                  </span>
                </div>
                <p className="break-words text-sm font-medium text-destructive">
                  {log.message}
                </p>
                {log.userId && (
                  <p className="text-xs text-muted-foreground">
                    User: <span className="font-mono">{log.userId}</span>
                  </p>
                )}
                {log.stack && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer select-none hover:text-foreground">
                      Stack trace
                    </summary>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
                      {log.stack}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
