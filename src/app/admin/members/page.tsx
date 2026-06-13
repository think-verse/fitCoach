import { requireAdminPage } from "../guard";
import { PageHeader, formatDate } from "../ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listPaidMembers, type PaidMember } from "@/lib/firestore/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Paid members" };

export default async function AdminMembersPage() {
  requireAdminPage();

  let members: PaidMember[] = [];
  let error: string | null = null;
  try {
    members = await listPaidMembers();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load paid members";
  }

  return (
    <div>
      <PageHeader
        title="Paid members"
        description="Members who unlocked access via the thank-you page."
        action={
          <Badge variant="success">{members.length} member{members.length === 1 ? "" : "s"}</Badge>
        }
      />

      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No paid members yet. They&apos;ll appear here after completing the
            thank-you flow.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Mobile</th>
                    <th className="px-5 py-3 font-medium">Grants</th>
                    <th className="px-5 py-3 font-medium">Last granted</th>
                    <th className="px-5 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr
                      key={m.email}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="px-5 py-3 font-medium">{m.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{m.email}</td>
                      <td className="px-5 py-3 text-muted-foreground">{m.mobile}</td>
                      <td className="px-5 py-3">
                        <Badge variant={m.grantCount > 1 ? "success" : "muted"}>
                          {m.grantCount}×
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDate(m.lastGrantedAt)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDate(m.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-border/60 md:hidden">
              {members.map((m) => (
                <div key={m.email} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{m.name}</div>
                    <Badge variant={m.grantCount > 1 ? "success" : "muted"}>
                      {m.grantCount}×
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{m.email}</div>
                  <div className="text-xs text-muted-foreground">{m.mobile}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Last granted {formatDate(m.lastGrantedAt)}
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
