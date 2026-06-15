import {
  Flame,
  Camera,
  Sparkles,
  Dumbbell,
  Salad,
  Bot,
  LineChart,
  RefreshCw,
  LogIn,
  ClipboardList,
  Images,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ThankYouForm } from "@/components/thank-you/thank-you-form";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "FitCoach";

export const metadata = {
  title: `Thank you — ${APP_NAME}`,
  description: "Confirm your details to generate your FitCoach access.",
  robots: { index: false, follow: false },
};

const FEATURES = [
  {
    icon: Camera,
    title: "AI physique scan",
    body: "Upload front / side / back photos and get an instant AI estimate of your body type, body-fat range, strengths, weak points, and priority muscle groups — plus BMI, BMR & TDEE.",
  },
  {
    icon: Dumbbell,
    title: "Personalized workout plan",
    body: "A full training split built around your goal, experience, equipment and injuries — sets, reps, rest, RPE, form cues, and demo videos for every exercise.",
  },
  {
    icon: Salad,
    title: "Smart diet plan",
    body: "Calorie and macro targets with real meals matched to your food preference and budget, a grocery list, and easy swaps to keep you on track.",
  },
  {
    icon: Bot,
    title: "AI coach chat",
    body: "Ask anything — swap an exercise, adjust for a missed day or extra calories, modify around an injury. Your coach knows your plan and answers in seconds.",
  },
  {
    icon: Images,
    title: "Weekly check-ins + photo comparison",
    body: "Log your week and upload new photos. The AI compares last week vs this week side-by-side and shows your body-fat, muscle and weight trends.",
  },
  {
    icon: LineChart,
    title: "Progress dashboard",
    body: "Your weight trend, current stats, and how far you've come — everything in one place so you can see the change as it happens.",
  },
];

const STEPS = [
  { icon: LogIn, t: "Sign in", d: "Use the email & temporary password generated on the right (also emailed to you)." },
  { icon: ClipboardList, t: "Complete onboarding", d: "Tell us your goal, experience, equipment, diet preference and measurements." },
  { icon: Camera, t: "Upload your physique", d: "Add front / side / back photos in good lighting for your AI body analysis." },
  { icon: Sparkles, t: "Get your AI analysis", d: "Body type, body-fat estimate, weak points, and realistic 30 & 90-day goals." },
  { icon: Dumbbell, t: "Generate your plan", d: "Receive a personalized workout + diet plan tailored to everything above." },
  { icon: RefreshCw, t: "Check in weekly", d: "Upload a weekly photo set — the AI compares your progress and adapts the plan." },
];

const DASHBOARD = [
  "Your active workout split and today's session",
  "Your diet targets, meals and grocery list",
  "Weight trend chart and stats over time",
  "Quick access to your AI coach and weekly check-in",
];

const COACH = [
  "“Can I replace bench press with dumbbell press?”",
  "“I missed gym today, what should I do?”",
  "“I ate 500 extra calories — how do I adjust?”",
  "“My shoulder hurts, modify today's workout.”",
];

/**
 * PUBLIC page (no auth) — users land here after paying elsewhere. They enter
 * name / email / mobile; we generate access, show the credentials on-screen,
 * and email them too. The rest of the page explains everything they unlocked.
 */
export default function ThankYouPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-hero-glow opacity-60"
      />

      <div className="container relative py-10 md:py-14">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Flame className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        </div>

        {/* order utilities: the form (aside) is order-1 → it sits on TOP on
            mobile and on the LEFT on desktop; the explainer is order-2 → below
            on mobile, right on desktop. */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* ===== Explainer ===== */}
          <main className="order-2 flex-1 space-y-14">
            {/* Hero */}
            <section>
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-emerald-300">
                Payment received — thank you 💚
              </span>
              <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight md:text-5xl">
                Everything you just{" "}
                <span className="gradient-text">unlocked</span>
              </h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                {APP_NAME} is your AI personal trainer, nutritionist, and coach in
                one. Generate your access on the {""}
                <span className="lg:hidden">form above</span>
                <span className="hidden lg:inline">form on the left</span>, sign
                in, and your full experience unlocks instantly. Here&apos;s what
                you can do.
              </p>
            </section>

            {/* What you're getting */}
            <section>
              <SectionTitle eyebrow="What you're getting" title="Your complete toolkit" />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {FEATURES.map((f) => (
                  <Card key={f.title} className="h-full border-border/70">
                    <CardContent className="p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <f.icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 font-semibold">{f.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {f.body}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* How it works / how to generate */}
            <section>
              <SectionTitle
                eyebrow="How it works"
                title="From sign-in to your plan in minutes"
              />
              <ol className="mt-6 space-y-3">
                {STEPS.map((s, i) => (
                  <li
                    key={s.t}
                    className="flex items-start gap-4 rounded-2xl border border-border bg-card/40 p-4"
                  >
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <s.icon className="h-5 w-5" />
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">{s.t}</div>
                      <div className="text-sm text-muted-foreground">{s.d}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* Dashboard + Coach */}
            <section className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/70">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Your dashboard</h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your home base after signing in — everything at a glance:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {DASHBOARD.map((d) => (
                      <li key={d} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Your AI coach</h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    A chat that knows your plan and adapts it to real life. Ask
                    things like:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {COACH.map((c) => (
                      <li
                        key={c}
                        className="rounded-lg border border-border bg-background/40 px-3 py-2 text-muted-foreground"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          </main>

          {/* ===== Access form (top on mobile, left on desktop) ===== */}
          <aside className="order-1 w-full lg:w-[380px] lg:shrink-0">
            <div className="space-y-4 lg:sticky lg:top-8">
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  Generate your <span className="gradient-text">access</span>
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your details — we&apos;ll create your account instantly and
                  show your login right here (and email it too).
                </p>
              </div>
              <Card className="card-glow">
                <CardContent className="p-6">
                  <ThankYouForm />
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-primary">
        {eyebrow}
      </div>
      <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
        {title}
      </h2>
    </div>
  );
}
