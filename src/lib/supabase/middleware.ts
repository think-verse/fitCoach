import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PUBLIC_PATHS = ["/", "/login", "/privacy", "/terms"];
const AUTH_CALLBACK = "/auth/callback";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const path = request.nextUrl.pathname;
  const isPublic =
    PUBLIC_PATHS.includes(path) ||
    path.startsWith(AUTH_CALLBACK) ||
    path.startsWith("/_next") ||
    path.startsWith("/api/auth") ||
    // Cron endpoint is hit by Vercel with no user cookie. It does its own
    // auth via CRON_SECRET, so don't bounce it to /login.
    path.startsWith("/api/cron");

  // For public paths we don't need to verify auth at all — skip the network
  // call entirely. Cheaper, and zero risk of false-logout on cold starts.
  if (isPublic) return response;

  // For protected paths, only redirect if we're CERTAIN the user is logged out.
  // Transient errors from Supabase (cold start, network blip) should NOT wipe
  // a user's session — let the request through and let the page-level
  // getCurrentUser() be authoritative. Worst case the page itself redirects.
  let user: { id: string } | null = null;
  let knownLoggedOut = false;
  try {
    const { data, error } = await supabase.auth.getUser();
    user = data.user;
    // Supabase returns 401 when the session is genuinely missing/invalid.
    // Any other error (5xx, network) → uncertain, don't redirect.
    if (error && (error.status === 401 || error.status === 403)) {
      knownLoggedOut = true;
    }
  } catch {
    // Network / fetch error. Treat as uncertain — let the request proceed.
  }

  if (!user && knownLoggedOut) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }

  return response;
}
