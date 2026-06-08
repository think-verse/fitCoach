"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

/**
 * Magic-link sign-in. Only EXISTING users can request a link — so unless
 * someone has paid (and been provisioned by the systeme.io webhook) OR signed
 * in via Google previously, they get a generic "if your email is in our
 * system, you'll get a link" response.
 *
 * We never reveal whether an email exists (account-enumeration protection).
 */
export function EmailSignInForm({ from }: { from?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);

    const supabase = createClient();
    const redirectTo = new URL(
      "/auth/callback",
      process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin,
    );
    if (from) redirectTo.searchParams.set("next", from);

    // shouldCreateUser:false — only existing (paid / Google-signed-in) users
    // can request a magic link. Random emails get the same generic UI message
    // so we don't leak which addresses exist.
    await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: redirectTo.toString(),
      },
    });

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
          If <span className="text-foreground">{email}</span> is registered,
          we&rsquo;ve sent a one-click sign-in link. It may take a minute to
          arrive — check spam if not.
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
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        Email me a sign-in link
      </Button>
    </form>
  );
}
