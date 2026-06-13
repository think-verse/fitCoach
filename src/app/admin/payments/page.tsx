import { CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireAdminPage } from "../guard";
import { PageHeader, formatDate } from "../ui";
import { getRecentPayments, type AdminPayment } from "@/lib/admin/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 100;

function statusVariant(status: string | null) {
  switch (status) {
    case "completed":
    case "succeeded":
    case "paid":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "failed":
    case "refunded":
      return "destructive" as const;
    default:
      return "muted" as const;
  }
}

function amount(p: AdminPayment): string {
  if (p.amount == null) return "—";
  return `${p.amount.toFixed(2)} ${p.currency ?? ""}`.trim();
}

export default async function AdminPaymentsPage() {
  requireAdminPage();

  let payments: AdminPayment[] = [];
  let error: string | null = null;
  try {
    payments = await getRecentPayments(LIMIT);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load payments";
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Recent transactions from the payments collection."
      />

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">
            Could not load payments: {error}
          </CardContent>
        </Card>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium">No payments yet</p>
              <p className="text-sm text-muted-foreground">
                Transactions will appear here once payments are recorded.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Tier</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Order ID</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium">{p.email ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.tier ?? "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{amount(p)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(p.status)}>
                          {p.status ?? "unknown"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {p.orderId ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-border/50 md:hidden">
              {payments.map((p) => (
                <div key={p.id} className="space-y-1.5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">
                      {p.email ?? "—"}
                    </span>
                    <Badge variant={statusVariant(p.status)}>
                      {p.status ?? "unknown"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {p.tier ?? "—"}
                    </span>
                    <span className="tabular-nums">{amount(p)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(p.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
