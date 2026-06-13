"use client";

import * as React from "react";
import {
  CheckCircle2,
  Loader2,
  Mail,
  ArrowRight,
  Dumbbell,
  Salad,
  Bot,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { grantAccess } from "@/app/actions/access";

const CONTACT_EMAIL = "contact@geekbotai.com";

const STEPS = [
  { icon: Mail, t: "Check your email", d: "We sent your login email + temporary password (check spam too)." },
  { icon: ArrowRight, t: "Sign in", d: "Open the sign-in page and log in with that email & password — no OTP." },
  { icon: Camera, t: "Upload your physique", d: "Add front / side / back photos for your AI body analysis." },
  { icon: Dumbbell, t: "Get your plan", d: "Receive a personalized workout & diet plan, then check in weekly." },
];

export function ThankYouForm() {
  const [status, setStatus] = React.useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");
  const [error, setError] = React.useState("");
  const [returning, setReturning] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", email: "", mobile: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    const res = await grantAccess(form);
    if (res.ok) {
      setReturning(!!res.returning);
      setStatus("done");
    } else {
      setError(res.error ?? "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h2 className="mt-5 text-2xl font-bold tracking-tight">
          All access generated 🎉
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {returning
            ? "Welcome back! We've refreshed your password — your existing data is exactly where you left it."
            : "Your FitCoach account is ready."}{" "}
          We&apos;ve emailed <strong className="text-foreground">{form.email}</strong>{" "}
          your login details.
        </p>

        <div className="mt-8 space-y-3 text-left">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.t}
                className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    {i + 1}. {s.t}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.d}</div>
                </div>
              </div>
            );
          })}
        </div>

        <Button asChild className="mt-8 w-full" size="lg">
          <a href="/login">
            Go to sign in <ArrowRight className="h-4 w-4" />
          </a>
        </Button>

        <p className="mt-6 text-xs text-muted-foreground">
          Need help? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Your name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="you@example.com"
        />
        <p className="text-xs text-muted-foreground">
          Use the same email each time — your access &amp; data stay linked to it.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="mobile">Mobile number</Label>
        <Input
          id="mobile"
          type="tel"
          required
          value={form.mobile}
          onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
          placeholder="+91 90000 00000"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Generating your access…
          </>
        ) : (
          <>
            Confirm &amp; generate my access <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Salad className="h-3 w-3 text-primary" /> Diet plan
        </span>
        <span className="inline-flex items-center gap-1">
          <Dumbbell className="h-3 w-3 text-primary" /> Workout plan
        </span>
        <span className="inline-flex items-center gap-1">
          <Bot className="h-3 w-3 text-primary" /> AI coach
        </span>
      </div>
    </form>
  );
}

export default ThankYouForm;
