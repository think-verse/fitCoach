"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientAuth } from "@/lib/firebase/client";

type Status = "verifying" | "ready" | "invalid" | "done";

/**
 * Custom password-reset handler. Firebase's email link points here (set the
 * "Customize action URL" for the Password reset template in the Firebase
 * console to <APP_URL>/reset-password). We verify the oobCode, let the user
 * choose a new password, then send them to sign in.
 */
export function ResetPasswordForm({
  oobCode,
  mode,
}: {
  oobCode?: string;
  mode?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("verifying");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Verify the reset code as soon as the page loads.
  useEffect(() => {
    if (mode !== "resetPassword" || !oobCode) {
      setStatus("invalid");
      return;
    }
    verifyPasswordResetCode(clientAuth(), oobCode)
      .then((mail) => {
        setEmail(mail);
        setStatus("ready");
      })
      .catch(() => setStatus("invalid"));
  }, [oobCode, mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      await confirmPasswordReset(clientAuth(), oobCode as string, password);
      setStatus("done");
      setTimeout(() => router.push("/login"), 2600);
    } catch (err) {
      console.error(err);
      setError("This reset link has expired. Please request a new one.");
      setSaving(false);
    }
  }

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm">Verifying your reset link…</p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">
              This link is invalid or has expired.
            </span>{" "}
            Reset links can only be used once and time out after a while. Please
            request a fresh one.
          </p>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <p className="font-semibold">Password updated</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You can now sign in with your new password. Taking you to sign
              in…
            </p>
          </div>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/login">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  // status === "ready"
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        Resetting password for{" "}
        <span className="font-medium text-foreground">{email}</span>
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          disabled={saving}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter your new password"
          disabled={saving}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={saving}>
        {saving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
        Set new password
      </Button>
    </form>
  );
}
