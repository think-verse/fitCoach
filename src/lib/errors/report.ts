import "server-only";

import { logError } from "@/lib/firestore/repo";

/**
 * Central error reporter. Persists the REAL error (message + stack) to the
 * admin-only errorLogs collection and logs to the server console. It never
 * throws — logging must not break the request — and it returns nothing the
 * caller should expose to the user.
 *
 * Pattern: catch → reportError(context, err, {userId}) → return a GENERIC
 * message to the client. Users must never see Firebase/Anthropic internals.
 */
export async function reportError(
  context: string,
  err: unknown,
  opts: { userId?: string | null; code?: string | null } = {},
): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack ?? null : null;

  // Always log to the server console first (survives even if Firestore write fails).
  console.error(`[${context}]`, err);

  try {
    await logError({
      context,
      message,
      stack,
      code: opts.code ?? null,
      userId: opts.userId ?? null,
    });
  } catch (e) {
    console.error("[reportError] failed to persist error log:", e);
  }
}

/** The single generic message users see for any unexpected server failure. */
export const GENERIC_ERROR =
  "Something went wrong on our end. Please try again.";
