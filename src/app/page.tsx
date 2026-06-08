import Link from "next/link";
import {
  ArrowRight,
  Camera,
  ChartBar,
  Dumbbell,
  Flame,
  Salad,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/supabase/server";

const FEATURES = [
  {
    icon: Camera,
    title: "AI physique scan",
    body: "Upload front / side / back photos and get an instant AI visual estimate of strengths, weak points, and priority muscle groups.",
  },
  {
    icon: Dumbbell,
    title: "Personalized training",
    body: "Split, exercises, sets, reps, rest, RPE, form cues, and demo links — built around your goal, gear, and recovery.",
  },
  {
    icon: Salad,
    title: "Smart diet plan",
    body: "Calorie & macro targets with real meals built for your food preference and budget, with easy swaps.",
  },
  {
    icon: ChartBar,
    title: "Weekly progress AI",
    body: "Upload a check-in photo each week. AI compares your photos and adjusts your plan automatically.",
  },
];

const STEPS = [
  { n: "1", t: "Upload physique", d: "Front, side, back — same lighting." },
  { n: "2", t: "Get AI analysis", d: "Body type, weak points, realistic goals." },
  { n: "3", t: "Unlock your plan", d: "Workout + diet, tailored to you." },
  { n: "4", t: "Track weekly", d: "Photo check-ins, AI re-adapts the plan." },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    bullets: [
      "BMI / BMR / TDEE calculator",
      "1 AI body analysis",
      "Basic dashboard",
    ],
    cta: "Start free",
    href: "/login",
    highlight: false,
  },
  {
    name: "Pro Monthly",
    price: "$12",
    cadence: "/month",
    bullets: [
      "Unlimited AI analyses",
      "Weekly plan updates",
      "AI coach chat",
      "Progress photo timeline",
      "Diet customization & swaps",
    ],
    cta: "Go Pro",
    href: "/login",
    highlight: true,
  },
  {
    name: "Lifetime",
    price: "$199",
    cadence: "one-time",
    bullets: [
      "Everything in Pro",
      "Lifetime access",
      "Early founder pricing",
      "All future features included",
    ],
    cta: "Get lifetime",
    href: "/login",
    highlight: false,
  },
];

const FAQ = [
  {
    q: "Is the AI body analysis medically accurate?",
    a: "No. It's an AI visual estimate based on your photos, not a medical measurement. For body fat percentage, muscle mass, or any medical condition, see a qualified professional. BMI is calculated accurately from your height and weight.",
  },
  {
    q: "What photos work best?",
    a: "Front, side, and back shots in good lighting, fitted clothing, and a neutral pose. Use the same lighting, distance, and pose each week — it's how the weekly comparison stays meaningful.",
  },
  {
    q: "Can I use this without a gym?",
    a: "Yes. Tell us your equipment (none, dumbbells, bands, full home gym, etc.) during onboarding and the plan adapts.",
  },
  {
    q: "Can I use the app if I'm vegan or vegetarian?",
    a: "Yes. During onboarding pick your food preference — vegan, vegetarian, eggetarian, or non-vegetarian — and every meal plan respects it.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from Settings — you keep Pro features until the period ends.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-dvh bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Flame className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">FitCoach</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="#pricing"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:block"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:block"
            >
              FAQ
            </Link>
            <Button asChild size="sm" variant={user ? "secondary" : "default"}>
              <Link href={user ? "/dashboard" : "/login"}>
                {user ? "Dashboard" : "Sign in"}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-glow">
        <div className="container relative pb-24 pt-16 md:pb-32 md:pt-24">
          <Badge variant="success" className="mb-6">
            <Sparkles className="mr-1 h-3 w-3" /> AI fitness, done right
          </Badge>
          <h1 className="max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Your AI personal trainer,{" "}
            <span className="gradient-text">diet coach</span> &amp; progress
            tracker in one app
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Upload your physique → get an instant AI body analysis → unlock a
            workout &amp; diet plan built for your goal, gear, and budget → check
            in weekly and watch your plan adapt.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="xl" className="w-full sm:w-auto">
              <Link href={user ? "/dashboard" : "/login"}>
                {user ? "Go to Dashboard" : "Start free — analyze my physique"}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="xl"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Link href="#how">See how it works</Link>
            </Button>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            AI visual estimate — not a medical diagnosis. For fitness guidance
            only.
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container py-20">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          The loop that actually works
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Most fitness apps stop at a calorie tracker. FitCoach closes the loop:
          analyze → plan → train → check in → adapt.
        </p>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n}>
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-lg font-bold text-primary">
                    {s.n}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="card-glow">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container py-20">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Simple pricing
        </h2>
        <p className="mt-3 text-muted-foreground">
          Start free. Upgrade when you want unlimited AI coaching and weekly
          plan updates.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PRICING.map((p) => (
            <Card
              key={p.name}
              className={
                p.highlight
                  ? "border-primary/40 bg-gradient-to-b from-primary/10 to-card card-glow"
                  : undefined
              }
            >
              <CardContent className="p-6">
                {p.highlight && (
                  <Badge variant="success" className="mb-3">
                    Most popular
                  </Badge>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {p.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {p.cadence}
                  </span>
                </div>
                <ul className="mt-6 space-y-2">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-8 w-full"
                  variant={p.highlight ? "default" : "outline"}
                  size="lg"
                >
                  <Link href={p.href}>{p.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container py-20">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Honest answers
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {FAQ.map((f) => (
            <Card key={f.q}>
              <CardContent className="p-6">
                <h3 className="font-semibold">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card card-glow">
          <CardContent className="p-10 text-center md:p-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              See your physique through AI eyes.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              60 seconds to your first AI body analysis. No credit card.
            </p>
            <Button asChild size="xl" className="mt-8">
              <Link href="/login">
                Get started free <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border/40 py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} FitCoach. For fitness only — not medical advice.</div>
          <div className="flex gap-4">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
