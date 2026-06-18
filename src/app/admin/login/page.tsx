import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdminAuthed } from "@/lib/admin/session";
import { LoginForm } from "./login-form";

export const metadata = { title: "Admin Login" };

export default function AdminLoginPage() {
  if (isAdminAuthed()) redirect("/admin");

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle>AesthetixAI Admin</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to access the admin panel
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
