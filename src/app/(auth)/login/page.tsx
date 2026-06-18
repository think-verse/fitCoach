import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleSignInButton } from "./google-signin-button";
import { PasswordSignInForm } from "@/components/auth/password-signin-form";
import { getCurrentUser } from "@/lib/firebase/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; from?: string };
}) {
  const user = await getCurrentUser();

  if (user) {
    redirect(searchParams.from || "/home");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-hero-glow px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Flame className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">AesthetixAI</span>
        </Link>

        <Card className="card-glow">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Members: sign in with the email &amp; password we sent you.
            </p>

            <div className="mt-8">
              <PasswordSignInForm from={searchParams.from} />
            </div>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <GoogleSignInButton from={searchParams.from} />

            {searchParams.error && (
              <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Sign-in failed. Please try again.
              </p>
            )}

            <p className="mt-8 text-center text-xs text-muted-foreground">
              By continuing you agree to our{" "}
              <Link href="/terms" className="underline">terms</Link> &amp;{" "}
              <Link href="/privacy" className="underline">privacy policy</Link>.
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <span className="text-foreground">Email &amp; password</span> is for
          members who purchased access.{" "}
          <span className="text-foreground">Google</span> creates a free account
          — purchase to unlock the app.
        </p>
      </div>
    </div>
  );
}
