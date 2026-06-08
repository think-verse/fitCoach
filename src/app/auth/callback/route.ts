import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// OAuth callback for Supabase Auth. Supabase redirects here with ?code=...
// We exchange the code for a session, then route the user forward.
//
// First-attempt failures on free-tier infra are almost always cold-start
// transient timeouts. We retry once before redirecting the user back to /login.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          return NextResponse.redirect(new URL(next, url.origin));
        }
        lastError = error;
      } catch (e) {
        lastError = e;
      }
      if (attempt === 1) {
        // Short backoff before the retry — gives the backend a moment to wake.
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    console.error("[auth/callback] exchange failed:", lastError);
  }

  return NextResponse.redirect(
    new URL("/login?error=callback_failed", url.origin),
  );
}
