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
    path.startsWith("/api/cron");

  // We MUST call supabase.auth.getUser() even on public paths. 
  // Why? To ensure the session is refreshed and cookies are updated in the browser.
  // If we skip this on public paths (like the landing page), the session might 
  // expire, and the next protected request would fail or force a re-login.
  let user: { id: string } | null = null;
  let knownLoggedOut = false;
  try {
    const { data, error } = await supabase.auth.getUser();
    user = data.user;
    if (error && (error.status === 401 || error.status === 403)) {
      knownLoggedOut = true;
    }
  } catch {
    // Network / fetch error. Treat as uncertain.
  }

  // Only redirect if NOT on a public path AND we are certain they are logged out.
  if (!isPublic && !user && knownLoggedOut) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }

  return response;
}
