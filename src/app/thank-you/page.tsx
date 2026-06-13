import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ThankYouForm } from "@/components/thank-you/thank-you-form";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "FitCoach";

export const metadata = {
  title: `Thank you — ${APP_NAME}`,
  description: "Confirm your details to generate your FitCoach access.",
  robots: { index: false, follow: false },
};

/**
 * PUBLIC page (no auth) — users land here after paying via PayPal elsewhere.
 * They enter name / email / mobile; we generate access + email credentials.
 */
export default function ThankYouPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-hero-glow opacity-70"
      />
      <div className="container relative flex min-h-dvh flex-col items-center justify-center py-12">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Flame className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        </div>

        <div className="w-full max-w-md text-center">
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-emerald-300">
            Payment received — thank you 💚
          </span>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Confirm your details to{" "}
            <span className="gradient-text">unlock everything</span>
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
            Enter your details below — we&apos;ll instantly generate your account
            and email your login. Then sign in and your full AI training, diet,
            and coaching unlock.
          </p>
        </div>

        <Card className="card-glow mt-8 w-full max-w-md">
          <CardContent className="p-6 md:p-8">
            <ThankYouForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
