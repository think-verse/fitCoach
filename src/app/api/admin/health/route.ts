import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/session";
import { queueStats } from "@/lib/ai/queue";

export const runtime = "nodejs";

/** Whether each external integration's env is present (booleans only). */
function envConfig() {
  return {
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    firebaseAdmin: Boolean(
      process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY,
    ),
  };
}

/**
 * GET — report config presence + queue depth (cheap, no network).
 * GET ?ping=anthropic — also do a lightweight reachability check against the
 * Anthropic API. We deliberately do NOT spend tokens: we send a malformed/empty
 * request and treat ANY HTTP response (even 400/401) as "reachable", since that
 * proves DNS + TLS + the API is up. Only a thrown fetch error = unreachable.
 */
export async function GET(req: Request) {
  try {
    requireAdmin();
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const config = envConfig();
  const queue = queueStats();

  let anthropicPing:
    | { reachable: boolean; status: number | null; note: string }
    | null = null;

  if (searchParams.get("ping") === "anthropic") {
    if (!config.anthropic) {
      anthropicPing = {
        reachable: false,
        status: null,
        note: "ANTHROPIC_API_KEY not configured",
      };
    } else {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 5000);
        // Empty body → API replies 400 instantly without running a model.
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
            "anthropic-version": "2023-06-01",
          },
          body: "{}",
          signal: controller.signal,
        });
        clearTimeout(t);
        anthropicPing = {
          reachable: true,
          status: res.status,
          note:
            res.status === 401
              ? "Reached API, but key was rejected (401)"
              : "Reached api.anthropic.com (no tokens spent)",
        };
      } catch {
        anthropicPing = {
          reachable: false,
          status: null,
          note: "Could not reach api.anthropic.com",
        };
      }
    }
  }

  return NextResponse.json({ config, queue, anthropicPing });
}
