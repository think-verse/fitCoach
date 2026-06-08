import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createAdminClient } from "@supabase/supabase-js";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — cookies can't be modified. Safe to ignore
            // because middleware refreshes the session before the request reaches us.
          }
        },
      },
    },
  );
}

/** Admin client uses the service role key — server only. */
export function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Resolve the currently signed-in user.
 *
 * Critical: cold-starts on free-tier Supabase/Vercel can cause the FIRST call
 * to auth.getUser() to time out or 5xx. The old implementation returned null on
 * any failure, which made every protected page redirect a logged-in user to
 * /login on a cold visit. Now we retry once on transient failure (~1.5s back-
 * off) and ONLY return null when Supabase definitively confirms no session
 * (HTTP 401/403) or we genuinely exhaust the retry.
 */
export async function getCurrentUser() {
  const supabase = createClient();

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (data.user) return data.user;
      // Definitive "no session" — don't waste time retrying.
      if (error && (error.status === 401 || error.status === 403)) {
        return null;
      }
      // Ambiguous: no user but no auth error either. Could be cold start.
      // Retry once before giving up.
    } catch {
      // Network / fetch failure. Retry once.
    }
    if (attempt === 1) await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
