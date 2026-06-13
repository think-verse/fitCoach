import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight auth gate. Edge middleware can't run the Firebase Admin SDK, so
 * we only check for the PRESENCE of the session cookie here and redirect
 * unauthenticated users away from protected routes. Full cryptographic
 * verification happens server-side in getCurrentUser() on each page/action.
 */
const SESSION_COOKIE = "fc_session";
const ADMIN_COOKIE = "fc_admin";

// App routes that require a signed-in user.
const PROTECTED = [
  "/home",
  "/upgrade",
  "/profile",
  "/dashboard",
  "/workout",
  "/diet",
  "/progress",
  "/coach",
  "/settings",
  "/onboarding",
  "/photos",
  "/analysis",
  "/generate",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin area (except its own login) requires the admin cookie.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!request.cookies.get(ADMIN_COOKIE)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  const needsAuth = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (needsAuth && !request.cookies.get(SESSION_COOKIE)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
