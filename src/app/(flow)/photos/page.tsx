import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { PhotoUpload } from "@/components/onboarding/photo-upload";

export const metadata = { title: "Upload your physique" };

export default async function PhotosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh bg-hero-glow px-4 py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Upload your <span className="gradient-text">physique</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Three quick shots — front, side, back. AI generates your analysis next.
          </p>
        </header>

        <PhotoUpload userId={user.id} weekNumber={0} />

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Your photos are stored privately in your own folder. You can delete them
          anytime from Settings.
        </p>
      </div>
    </div>
  );
}
