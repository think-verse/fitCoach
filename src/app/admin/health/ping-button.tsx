"use client";

import * as React from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PingResult {
  reachable: boolean;
  status: number | null;
  note: string;
}

export function AnthropicPing() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<PingResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function ping() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/health?ping=anthropic");
      if (!res.ok) {
        setError(res.status === 403 ? "Forbidden" : `HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      setResult(data.anthropicPing ?? null);
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button variant="secondary" size="sm" onClick={ping} disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Ping Anthropic API
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {result && (
        <div className="flex items-start gap-2 text-sm">
          {result.reachable ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          )}
          <span className={result.reachable ? "" : "text-destructive"}>
            {result.note}
            {result.status != null && (
              <span className="text-muted-foreground"> (HTTP {result.status})</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
