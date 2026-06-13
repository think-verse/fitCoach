"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/actions/account";
import { cn } from "@/lib/utils";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "FitCoach";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/#faq" },
];

export interface NavbarProps {
  /** Whether a session user is signed in (resolved server-side by the page). */
  isAuthed?: boolean;
  /** Display name of the signed-in user, if any. */
  userName?: string | null;
}

export function Navbar({ isAuthed = false, userName = null }: NavbarProps) {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initial = (userName?.trim().charAt(0) || "?").toUpperCase();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/40 bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2"
          onClick={() => setOpen(false)}
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary transition-transform group-hover:scale-105">
            <Flame className="h-5 w-5" />
            <span className="absolute inset-0 -z-10 rounded-xl bg-emerald-500/30 blur-md opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group relative px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
              <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-gradient-to-r from-emerald-400 to-teal-300 transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}

          {isAuthed ? (
            <div className="ml-2 flex items-center gap-2">
              {/* Profile chip → links to the user's profile */}
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-border bg-card/60 py-1 pl-1 pr-3 transition-colors hover:bg-accent"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {initial}
                </span>
                <span className="max-w-[8rem] truncate text-sm font-medium">
                  {userName ?? "My profile"}
                </span>
              </Link>
              <form action={signOut}>
                <Button type="submit" size="sm" variant="outline">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </form>
            </div>
          ) : (
            <Button asChild size="sm" className="ml-2">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-accent md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Animated bottom hairline (only once scrolled) */}
      <div
        className={cn(
          "hairline-glow h-px transition-opacity duration-300",
          scrolled ? "opacity-60" : "opacity-0",
        )}
      />

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-border/40 bg-background/95 backdrop-blur-xl md:hidden"
          >
            <nav className="container flex flex-col gap-1 py-3">
              {/* Profile row when signed in */}
              {isAuthed && (
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="mb-1 flex items-center gap-3 rounded-lg border border-border bg-card/60 px-3 py-2.5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                    {initial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {userName ?? "My profile"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      View profile
                    </div>
                  </div>
                </Link>
              )}

              {NAV_LINKS.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}

              {isAuthed ? (
                <form action={signOut} className="mt-2">
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full"
                    onClick={() => setOpen(false)}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                </form>
              ) : (
                <Button
                  asChild
                  className="mt-2 w-full"
                  onClick={() => setOpen(false)}
                >
                  <Link href="/login">Sign in</Link>
                </Button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
