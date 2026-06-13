import Link from "next/link";
import { CheckCircle2, Sparkles, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getPricing } from "@/lib/firestore/repo";
import { Navbar } from "@/components/marketing/navbar";
import type { PricingTier } from "@/lib/firestore/types";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "FitCoach";

export const metadata = {
  title: `Pricing — ${APP_NAME}`,
  description:
    "Simple pricing for AI fitness coaching. Start free, upgrade for unlimited analyses and weekly plan updates.",
};

function intervalLabel(interval: PricingTier["interval"]): string {
  switch (interval) {
    case "month":
      return "billed monthly";
    case "year":
      return "billed yearly";
    case "one_time":
      return "one-time payment";
    default:
      return "";
  }
}

function PageShell({
  isAuthed,
  userName,
  children,
}: {
  isAuthed: boolean;
  userName?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar isAuthed={isAuthed} userName={userName} />
      {children}
      <footer className="border-t border-border/40 py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <div>
            © {new Date().getFullYear()} {APP_NAME}. For fitness only — not
            medical advice.
          </div>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default async function PricingPage() {
  const [user, pricing] = await Promise.all([getCurrentUser(), getPricing()]);
  const isAuthed = Boolean(user);
  const userName = user?.name ?? null;

  const tiers = (pricing?.tiers ?? []).filter((t) => t.active);

  if (tiers.length === 0) {
    return (
      <PageShell isAuthed={isAuthed} userName={userName}>
        <section className="container flex flex-col items-center py-28 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Clock className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">
            Pricing coming soon
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            We&apos;re finalizing our plans. In the meantime, you can get
            started for free and explore {APP_NAME}.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href={isAuthed ? "/dashboard" : "/login"}>
              {isAuthed ? "Go to dashboard" : "Start free"}
            </Link>
          </Button>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell isAuthed={isAuthed} userName={userName}>
      <section className="container py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="success" className="mb-4">
            <Sparkles className="mr-1 h-3 w-3" /> Simple, honest pricing
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Coaching that pays for itself
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade when you want unlimited AI coaching and weekly
            plan updates.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => {
            const isPaid = tier.amount > 0;
            return (
              <Card
                key={tier.id}
                className={
                  tier.highlighted
                    ? "relative border-primary/40 bg-gradient-to-b from-primary/10 to-card card-glow"
                    : "relative"
                }
              >
                <CardContent className="flex h-full flex-col p-6">
                  {tier.highlighted && (
                    <Badge variant="success" className="mb-3 w-fit">
                      Most popular
                    </Badge>
                  )}
                  <h2 className="text-lg font-semibold">{tier.name}</h2>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-bold tracking-tight">
                      {tier.priceLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {intervalLabel(tier.interval)}
                  </p>

                  <ul className="mt-6 space-y-2">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-6">
                    {isPaid ? (
                      <Button
                        asChild
                        className="w-full"
                        variant={tier.highlighted ? "default" : "outline"}
                        size="lg"
                      >
                        <Link
                          href={
                            isAuthed
                              ? "/dashboard"
                              : `/login?next=${encodeURIComponent("/pricing")}`
                          }
                        >
                          Get started
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        className="w-full"
                        variant="outline"
                        size="lg"
                      >
                        <Link href={isAuthed ? "/dashboard" : "/login"}>
                          {isAuthed ? "Go to dashboard" : "Start free"}
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-md text-center text-xs text-muted-foreground">
          Secure checkout coming soon.
        </p>
      </section>
    </PageShell>
  );
}
