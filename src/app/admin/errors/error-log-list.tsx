"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "../ui";
import type { ErrorLogEntry } from "@/lib/firestore/types";

export function ErrorLogList({ initial }: { initial: ErrorLogEntry[] }) {
  const [logs, setLogs] = React.useState<ErrorLogEntry[]>(initial);
  // Tracks the id currently being deleted ("__all__" while clearing).
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function deleteOne(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/errors?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed (HTTP ${res.status})`);
      }
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete log");
    } finally {
      setBusy(null);
    }
  }

  async function clearAll() {
    if (!confirm(`Delete all ${logs.length} error logs? This can't be undone.`)) {
      return;
    }
    setBusy("__all__");
    setError(null);
    try {
      const res = await fetch(`/api/admin/errors?all=1`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed (HTTP ${res.status})`);
      }
      setLogs([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear logs");
    } finally {
      setBusy(null);
    }
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-muted-foreground">
          No errors logged. 🎉
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {logs.length} {logs.length === 1 ? "entry" : "entries"}
        </span>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-destructive">{error}</span>}
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            disabled={busy !== null}
          >
            {busy === "__all__" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Clear all
          </Button>
        </div>
      </div>

      {logs.map((log) => (
        <Card key={log.id}>
          <CardContent className="space-y-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted">{log.context}</Badge>
              {log.code && <Badge variant="success">{log.code}</Badge>}
              <span className="ml-auto text-xs text-muted-foreground">
                {formatDate(log.createdAt)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => log.id && deleteOne(log.id)}
                disabled={busy !== null || !log.id}
                aria-label="Delete this log"
              >
                {busy === log.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
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
  );
}
