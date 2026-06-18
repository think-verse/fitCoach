import Link from "next/link";
import {
  ArrowRight,
  Camera,
  ChartBar,
  Dumbbell,
  LogIn,
  Mail,
  RefreshCw,
  Salad,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getProfile } from "@/lib/firestore/repo";
import { Navbar } from "@/components/marketing/navbar";
import { Faq } from "@/components/marketing/faq";
import { Reveal } from "@/components/marketing/reveal";
import { Hero } from "@/components/marketing/hero";
import { AnimatedCounter } from "@/components/marketing/animated-counter";

const APP_NAME = "AesthetixAI";

const STATS = [
  { value: 60, suffix: "s", label: "To your first AI analysis" },
  { value: 3, suffix: "", label: "Photo angles read by AI" },
  { value: 100, suffix: "%", label: "Personalized to you" },
  { value: 7, suffix: "-day", label: "Adaptive check-in loop" },
];

const STEPS = [
  { icon: LogIn, n: "1", t: "Sign in", d: "Free account in seconds — no card." },
  { icon: Camera, n: "2", t: "Upload photos", d: "Front, side, back — same lighting." },
  { icon: Sparkles, n: "3", t: "AI analysis", d: "Body type, weak points, BMI/TDEE." },
  { icon: Dumbbell, n: "4", t: "Get your plan", d: "Workout + diet for your gear." },
  { icon: RefreshCw, n: "5", t: "Check in weekly", d: "AI re-adapts as you change." },
];

const FEATURES = [
  {
    icon: Camera,
    title: "AI physique scan",
    body: "Upload front / side / back photos and get an instant AI visual estimate of strengths, weak points, and priority muscle groups.",
    span: "md:col-span-2",
  },
  {
    icon: Dumbbell,
    title: "Personalized training",
    body: "Split, sets, reps, rest, RPE, form cues, and demo links — built around your goal, gear, and recovery.",
    span: "md:col-span-1",
  },
  {
    icon: Salad,
    title: "Smart diet plan",
    body: "Calorie & macro targets with real meals for your food preference and budget, with easy swaps.",
    span: "md:col-span-1",
  },
  {
    icon: ChartBar,
    title: "Weekly progress AI",
    body: "Upload a check-in photo each week. The AI compares your photos over time and adjusts your plan automatically.",
    span: "md:col-span-2",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "The weekly photo check-ins kept me honest. My plan actually changed as I changed — it felt like a real coach.",
    name: "Early member",
    role: "Fat loss, 12 weeks",
  },
  {
    quote:
      "Finally a plan that fit my home gym and my budget. The macro targets were easy to hit with the meal swaps.",
    name: "Early member",
    role: "Recomposition",
  },
  {
    quote:
      "The AI spotted that my shoulders were lagging and reprioritized my split. Loved how specific it was.",
    name: "Early member",
    role: "Muscle gain",
  },
];

const GOAL_LABELS: Record<string, string> = {
  fat_loss: "Fat loss",
  muscle_gain: "Muscle gain",
  recomposition: "Recomposition",
  strength: "Strength",
  general_fitness: "General fitness",
};

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
    q: "Do you support vegan or vegetarian diets?",
    a: "Yes. During onboarding pick your food preference — vegan, vegetarian, eggetarian, or non-vegetarian — and every meal plan respects it.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Manage your plan from Settings — you keep Pro features until the period ends.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const isAuthed = Boolean(user);

  const profile = user ? await getProfile(user.id).catch(() => null) : null;
  const userName = profile?.name ?? user?.name ?? null;
  const goalLabel = profile?.goal ? (GOAL_LABELS[profile.goal] ?? null) : null;

  const primary = isAuthed
    ? { label: "Open my dashboard", href: "/home" }
    : { label: "Start free — analyze my physique", href: "/login" };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar isAuthed={isAuthed} userName={userName} />

      <Hero
        primaryLabel={primary.label}
        primaryHref={primary.href}
        userName={userName}
        goalLabel={goalLabel}
      />

      {/* Stats strip */}
      <section className="border-y border-border/40 bg-card/30">
        <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          {STATS.map((s) => (
            <Reveal key={s.label} className="text-center">
              <div className="text-3xl font-bold tracking-tight md:text-4xl">
                <AnimatedCounter
                  value={s.value}
                  suffix={s.suffix}
                  className="gradient-text-animated"
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground md:text-sm">
                {s.label}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container py-20 md:py-28">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            The loop that actually works
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Most fitness apps stop at a calorie tracker. {APP_NAME} closes the
            loop: sign in → upload photos → AI analysis → personalized plan →
            weekly check-ins.
          </p>
        </Reveal>

        <div className="relative mt-12">
          {/* Connecting line behind the cards (desktop) */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent lg:block"
          />
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={s.n}>
                  <Reveal delay={i * 0.06}>
                    <div className="group relative rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
                      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-background text-primary shadow-sm transition-colors group-hover:bg-primary/10">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="mt-4 text-xs font-bold uppercase tracking-wide text-primary">
                        Step {s.n}
                      </div>
                      <h3 className="mt-1 text-lg font-semibold">{s.t}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {s.d}
                      </p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Features — bento */}
      <section id="features" className="container py-20 md:py-28">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to keep going
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Built around the science of adherence — clear targets, real meals,
            and a plan that evolves with you.
          </p>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 0.05} className={f.span}>
                <Card className="group card-glow relative h-full overflow-hidden transition-all duration-300 hover:-translate-y-1">
                  {/* hover glow */}
                  <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                  <CardContent className="relative p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {f.body}
                    </p>
                  </CardContent>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Social proof */}
      <section className="container py-20 md:py-28">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            People who closed the loop
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Early members using {APP_NAME} to train smarter, eat better, and
            actually see the change.
          </p>
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.quote} delay={i * 0.05}>
              <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
                    “{t.quote}”
                  </p>
                  <div className="mt-4 text-sm">
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-muted-foreground">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container py-20 md:py-28">
        <Reveal>
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
            Honest answers
          </h2>
        </Reveal>
        <Faq items={FAQ} />
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <Reveal>
          <Card className="card-glow relative overflow-hidden border-primary/30">
            {/* animated gradient wash */}
            <div
              aria-hidden
              className="absolute inset-0 animate-gradient-pan bg-[linear-gradient(110deg,hsl(var(--card)),rgba(16,185,129,0.18),hsl(var(--card)))] bg-[length:220%_100%]"
            />
            <CardContent className="relative p-10 text-center md:p-16">
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
                See your physique through{" "}
                <span className="gradient-text-animated">AI eyes</span>.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                60 seconds to your first AI body analysis. No credit card.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="xl"
                  className="h-auto min-h-[4rem] w-full whitespace-normal py-4 text-center leading-snug sm:w-auto"
                >
                  <Link href={primary.href}>
                    {primary.label}{" "}
                    <ArrowRight className="h-5 w-5 shrink-0" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      <footer className="border-t border-border/40 py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <div>
            © {new Date().getFullYear()} {APP_NAME}. For fitness only — not
            medical advice.
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <a
              href="mailto:contact@geekbotai.com"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" /> contact@geekbotai.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
