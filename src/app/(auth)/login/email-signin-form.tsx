"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { sendSignInLinkToEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clientAuth } from "@/lib/firebase/client";

const EMAIL_KEY = "fc_emailForSignIn";

/**
 * Passwordless email magic-link sign-in (Firebase). We send a one-click link;
 * completion happens at /auth/callback. We stash the email in localStorage so
 * the callback can complete sign-in without re-prompting.
 */
export function EmailSignInForm({ from }: { from?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const url = new URL("/auth/callback", origin);
    if (from) url.searchParams.set("next", from);

    try {
      await sendSignInLinkToEmail(clientAuth(), email.trim(), {
        url: url.toString(),
        handleCodeInApp: true,
      });
      window.localStorage.setItem(EMAIL_KEY, email.trim());
    } catch (err) {
      console.error(err);
    }
    // Always show success — never reveal whether the email exists.
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <Mail className="h-4 w-4" /> Check your inbox
        </div>
        <p className="mt-1 text-muted-foreground">
          We&rsquo;ve sent a one-click sign-in link to{" "}
          <span className="text-foreground">{email}</span>. It may take a minute
          to arrive — check spam if not.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        disabled={loading}
      />
      <Button type="submit" disabled={loading || !email.trim()} className="w-full" size="lg">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        Email me a sign-in link
      </Button>
    </form>
  );
}
