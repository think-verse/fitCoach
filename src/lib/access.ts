import type { Subscription } from "@/lib/firestore/types";

/**
 * A user has paid access if they hold a non-free tier with a live status.
 * Free / Google-only users (no subscription doc) do NOT qualify — they're
 * locked out until they come through the /thank-you flow.
 */
export function hasPaidAccess(sub: Subscription | null | undefined): boolean {
  if (!sub) return false;
  if (sub.tier === "free") return false;
  return sub.status === "active" || sub.status === "trialing";
}
