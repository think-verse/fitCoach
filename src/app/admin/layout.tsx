import { isAdminAuthed } from "@/lib/admin/session";
import { AdminSidebar } from "./sidebar";

export const metadata = {
  title: { default: "Admin", template: "%s · AesthetixAI Admin" },
};

/**
 * Admin chrome. When authenticated we render the sidebar shell around the page.
 * When not (e.g. the login page, or before sign-in) we render children bare —
 * each protected page additionally calls requireAdminPage() to redirect, so an
 * unauthenticated visitor to a protected route still bounces to /admin/login.
 */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!isAdminAuthed()) {
    return <div className="min-h-dvh bg-background">{children}</div>;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background md:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
