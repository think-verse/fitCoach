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
  // Validate `next` — only allow same-origin paths. A full URL or protocol-
  // relative `//evil.com` would otherwise turn this into an open redirect.
  const rawNext = url.searchParams.get("next") ?? "/dashboard";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  if (code) {
    const supabase = createClient();
    let lastError: unknown = null;

    // OAuth codes are single-use. Once exchangeCodeForSession() reaches
    // Supabase and gets ANY response (success OR error), the code is consumed
    // on Supabase's side — retrying with the same code will then 400 with
    // "code already used", masking the original error.
    //
    // So: only retry when the request THREW (i.e. never reached Supabase —
    // network blip, cold-start fetch timeout). If Supabase replied with an
    // `error`, that's final — bail immediately.
    for (let attempt = 1; attempt <= 3; attempt++) {
      let networkThrow = false;
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          return NextResponse.redirect(new URL(next, url.origin));
        }
        // Supabase saw the code and rejected it. Don't retry.
        lastError = error;
        break;
      } catch (e) {
        // Network-level failure: code may still be valid. Retry.
        networkThrow = true;
        lastError = e;
      }

      if (networkThrow && attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 1500));
      }
    }

    console.error("[auth/callback] exchange failed:", lastError);
  }

  return NextResponse.redirect(
    new URL("/login?error=callback_failed", url.origin),
  );
}
