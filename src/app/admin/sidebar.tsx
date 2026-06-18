"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BarChart3,
  Activity,
  Tag,
  SlidersHorizontal,
  AlertTriangle,
  CreditCard,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/members", label: "Paid members", icon: UserCheck },
  { href: "/admin/usage", label: "Usage", icon: BarChart3 },
  { href: "/admin/health", label: "API Health", icon: Activity },
  { href: "/admin/limits", label: "Usage limits", icon: SlidersHorizontal },
  { href: "/admin/errors", label: "Error logs", icon: AlertTriangle },
  { href: "/admin/pricing", label: "Pricing", icon: Tag },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    onNavigate?.();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
      <button
        onClick={logout}
        className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Logout
      </button>
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <ShieldCheck className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-semibold leading-none">AesthetixAI</div>
        <div className="text-xs text-muted-foreground">Admin</div>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex h-full flex-col gap-6 p-4">
          <Brand />
          <NavLinks />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <Brand />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col gap-6 border-r border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <Brand />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
