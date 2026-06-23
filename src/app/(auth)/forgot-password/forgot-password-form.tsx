"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { ArrowLeft, Loader2, Mail, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientAuth } from "@/lib/firebase/client";

/**
 * "Forgot password" — sends a Firebase password-reset email. The reset link
 * lands the user on /reset-password (set as the custom action URL in the
 * Firebase console). We always show the success state, even if the email
 * isn't registered, so we never leak which addresses have accounts.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [configError, setConfigError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setConfigError("");

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    try {
      await sendPasswordResetEmail(clientAuth(), email.trim(), {
        // Continue URL: where Firebase sends the user after a successful reset.
        url: `${origin}/login`,
        handleCodeInApp: false,
      });
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      // Domain/continue-URL misconfig means NO email was sent — surface it so
      // it isn't mistaken for success during setup. Everything else (e.g.
      // user-not-found) is swallowed so we never leak account existence.
      if (
        code === "auth/unauthorized-continue-uri" ||
        code === "auth/invalid-continue-uri" ||
        code === "auth/missing-continue-uri" ||
        code === "auth/unauthorized-domain"
      ) {
        console.error("Password reset blocked by Firebase config:", code);
        setConfigError(
          `${origin.replace(/^https?:\/\//, "")} isn't an authorized domain in Firebase. Add it under Authentication → Settings → Authorized domains.`,
        );
        setLoading(false);
        return;
      }
      console.error(err);
    }
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-primary">
            <Mail className="h-4 w-4" /> Check your email
          </div>
          <p className="mt-1.5 text-muted-foreground">
            If an account exists for{" "}
            <span className="text-foreground">{email}</span>, we&rsquo;ve sent a
            link to reset your password. Click it to choose a new one and sign
            in.
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">
              Don&rsquo;t see it?
            </span>{" "}
            It can take a minute to arrive. Be sure to check your{" "}
            <span className="font-medium text-foreground">
              Spam, Junk and Promotions
            </span>{" "}
            folders — the email comes from a no-reply address and sometimes
            lands there.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setSent(false)}
          >
            Use a different email
          </Button>
          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={loading}
        />
      </div>
      {configError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {configError}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={loading || !email.trim()}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        Send reset link
      </Button>
      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
    </form>
  );
}
