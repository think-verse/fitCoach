import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireAdminPage } from "../guard";
import { PageHeader, TierBadge, formatDate } from "../ui";
import { listUsers, type AdminUserRow } from "@/lib/admin/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
type Filter = "all" | "paid" | "free";
const PAID = new Set(["pro_monthly", "pro_yearly", "lifetime"]);

function applyFilter(users: AdminUserRow[], filter: Filter): AdminUserRow[] {
  if (filter === "paid") return users.filter((u) => PAID.has(u.tier));
  if (filter === "free") return users.filter((u) => !PAID.has(u.tier));
  return users;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "free", label: "Free" },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { filter?: string; pageToken?: string };
}) {
  requireAdminPage();

  const filter: Filter =
    searchParams.filter === "paid" || searchParams.filter === "free"
      ? searchParams.filter
      : "all";
  const pageToken = searchParams.pageToken;

  let users: AdminUserRow[] = [];
  let nextPageToken: string | null = null;
  let error: string | null = null;
  try {
    const res = await listUsers(PAGE_SIZE, pageToken);
    users = applyFilter(res.users, filter);
    nextPageToken = res.nextPageToken;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load users";
  }

  const linkFor = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    if (params.filter && params.filter !== "all") sp.set("filter", params.filter);
    if (params.pageToken) sp.set("pageToken", params.pageToken);
    const q = sp.toString();
    return `/admin/users${q ? `?${q}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Users"
        description="Firebase Auth users merged with their subscription tier."
      />

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <Link key={f.key} href={linkFor({ filter: f.key })}>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                filter === f.key
                  ? "border-transparent bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </span>
          </Link>
        ))}
      </div>

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">
            Could not load users: {error}
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
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Tier</th>
                    <th className="px-4 py-3 font-medium">Signed up</th>
                    <th className="px-4 py-3 font-medium">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.uid}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">{u.email ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.displayName ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <TierBadge tier={u.tier} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(u.creationTime)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(u.lastSignInTime)}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-muted-foreground"
                      >
                        No users on this page.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-border/50 md:hidden">
              {users.map((u) => (
                <div key={u.uid} className="space-y-1 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{u.email ?? "—"}</span>
                    <TierBadge tier={u.tier} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {u.displayName ?? "No name"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Joined {formatDate(u.creationTime)} · Active{" "}
                    {formatDate(u.lastSignInTime)}
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="p-10 text-center text-muted-foreground">
                  No users on this page.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Showing {users.length} user{users.length === 1 ? "" : "s"}
          {filter !== "all" ? ` (${filter})` : ""}
        </span>
        {nextPageToken && (
          <Link href={linkFor({ filter, pageToken: nextPageToken })}>
            <Button variant="secondary" size="sm">
              Next page
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
      {filter !== "all" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Note: filtering applies to the current page only (paging is by Firebase
          Auth, which doesn&apos;t filter by tier).
        </p>
      )}
    </div>
  );
}
