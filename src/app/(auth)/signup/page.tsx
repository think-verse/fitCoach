import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SignUpForm } from "@/components/auth/signup-form";
import { getCurrentUser } from "@/lib/firebase/auth";

export const metadata = { title: "Sign up" };

export default async function SignUpPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/home");
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
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign up in seconds — no email verification needed.
            </p>

            <div className="mt-8">
              <SignUpForm />
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary underline">
                Sign in
              </Link>
            </p>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              By continuing you agree to our{" "}
              <Link href="/terms" className="underline">terms</Link> &amp;{" "}
              <Link href="/privacy" className="underline">privacy policy</Link>.
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          New accounts are <span className="text-foreground">free</span> — purchase
          access to unlock the full app.
        </p>
      </div>
    </div>
  );
}
