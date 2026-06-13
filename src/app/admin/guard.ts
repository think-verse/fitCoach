import "server-only";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin/session";

/**
 * Page-level admin gate. Call at the top of every protected admin page.
 * Redirects unauthenticated visitors to the login page. (The layout only
 * renders chrome — gating lives here so the login page can bypass it.)
 */
export function requireAdminPage(): void {
  if (!isAdminAuthed()) redirect("/admin/login");
}
