"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { Loader2, Flame } from "lucide-react";
import { clientAuth } from "@/lib/firebase/client";

const EMAIL_KEY = "fc_emailForSignIn";

/**
 * Completes a passwordless email-link sign-in. Firebase redirects the user
 * here from the emailed link; we exchange it for a session, mint the server
 * cookie, then forward to the app.
 *
 * useSearchParams() requires a Suspense boundary during static export, so the
 * logic lives in an inner component wrapped below.
 */
function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    const next = params.get("next") || "/home";
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/home";

    async function complete() {
      const auth = clientAuth();
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        setError(true);
        return;
      }
      let email = window.localStorage.getItem(EMAIL_KEY);
      if (!email) {
        email = window.prompt("Confirm your email to finish signing in") ?? "";
      }
      if (!email) {
        setError(true);
        return;
      }
      try {
        const cred = await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem(EMAIL_KEY);
        const idToken = await cred.user.getIdToken();
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (!res.ok) throw new Error("session");
        router.push(safeNext);
        router.refresh();
      } catch (e) {
        console.error(e);
        setError(true);
      }
    }
    void complete();
  }, [params, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Flame className="h-6 w-6" />
      </div>
      {error ? (
        <>
          <p className="text-sm text-destructive">
            This sign-in link is invalid or expired.
          </p>
          <a href="/login" className="text-sm underline">
            Back to sign in
          </a>
        </>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Signing you in…
        </p>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
