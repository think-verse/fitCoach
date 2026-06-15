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
  Copy,
  Check,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { grantAccess } from "@/app/actions/access";

const CONTACT_EMAIL = "contact@geekbotai.com";

interface Creds {
  email: string;
  password: string;
  loginUrl?: string;
}

export function ThankYouForm() {
  const [status, setStatus] = React.useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");
  const [error, setError] = React.useState("");
  const [returning, setReturning] = React.useState(false);
  const [creds, setCreds] = React.useState<Creds | null>(null);
  const [form, setForm] = React.useState({ name: "", email: "", mobile: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    const res = await grantAccess(form);
    if (res.ok) {
      setReturning(!!res.returning);
      if (res.email && res.password) {
        setCreds({ email: res.email, password: res.password, loginUrl: res.loginUrl });
      }
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
          You&apos;re in 🎉
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {returning
            ? "Welcome back! We've refreshed your password — your existing data is exactly where you left it."
            : "Your account is ready."}{" "}
          Your login is below — and we&apos;ve also emailed it to{" "}
          <strong className="text-foreground">{form.email}</strong>.
        </p>

        {creds && <Credentials creds={creds} />}

        <Button asChild className="mt-6 w-full" size="lg">
          <a href={creds?.loginUrl || "/login"}>
            Sign in now <ArrowRight className="h-4 w-4" />
          </a>
        </Button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          A copy was emailed to you (check spam too).
        </p>

        <p className="mt-4 text-xs text-muted-foreground">
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

      {status === "error" && <p className="text-sm text-destructive">{error}</p>}

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

/* On-screen login credentials with reveal + copy, so the user never has to
   leave the page to open their email. */
function Credentials({ creds }: { creds: Creds }) {
  const [show, setShow] = React.useState(false);

  return (
    <div className="mt-6 space-y-2.5 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-left">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
        <KeyRound className="h-3.5 w-3.5" />
        Your login
      </div>

      <CredRow label="Email" value={creds.email} />

      <div className="space-y-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Temporary password
        </span>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2">
          <code className="flex-1 truncate font-mono text-sm">
            {show ? creds.password : "•".repeat(creds.password.length)}
          </code>
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <CopyButton value={creds.password} />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Save these now. You can change your password after signing in.
      </p>
    </div>
  );
}

function CredRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2">
        <span className="flex-1 truncate text-sm">{value}</span>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="text-muted-foreground transition-colors hover:text-foreground"
      aria-label={copied ? "Copied" : "Copy"}
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-400" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

export default ThankYouForm;
