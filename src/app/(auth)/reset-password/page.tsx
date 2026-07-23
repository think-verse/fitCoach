import Link from "next/link";
import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = { title: "Set a new password" };

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { oobCode?: string; mode?: string };
}) {
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
            <h1 className="text-2xl font-bold tracking-tight">
              Set a new password
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a strong password you&rsquo;ll remember.
            </p>

            <div className="mt-8">
              <ResetPasswordForm
                oobCode={searchParams.oobCode}
                mode={searchParams.mode}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
