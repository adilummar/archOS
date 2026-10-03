import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData, platformSessionOptions, type PlatformSessionData } from "@/lib/session";

/**
 * Protected routes — any path that requires authentication.
 * Public routes — accessible without a session.
 */
const PUBLIC_PATHS = ["/api/health", 
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/super-admin/login",
  "/api/auth/super-admin/logout",
  "/client",
  "/contractor",
  "/_next",
  "/favicon.ico",
];

function isPublicPath(pathname: string): boolean {
  // Login pages: /<firmSlug>/login
  if (pathname.match(/^\/[^/]+\/login$/)) return true;
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Platform routes
  if (pathname.startsWith("/super-admin") || pathname.startsWith("/api/v1/platform")) {
    if (pathname === "/super-admin/login" || pathname === "/api/auth/super-admin/login") {
      return NextResponse.next();
    }
    const platformSession = await getIronSession<PlatformSessionData>(await cookies(), platformSessionOptions);
    if (!platformSession.platformAdminId) {
      if (pathname.startsWith("/api/")) {
        // If they have a regular tenant session, it's 403 Forbidden. Otherwise 401.
        const tenantSession = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (tenantSession.userId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/super-admin/login", req.url));
    }
    return NextResponse.next();
  }


  // Always allow public paths through
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Read session — iron-session decrypts and verifies the cookie server-side
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  // No valid session → redirect to login
  if (!session.userId) {
    // Determine firm slug from path for redirect
    const slugMatch = pathname.match(/^\/([^/]+)\//);
    const firmSlug = slugMatch?.[1] ?? "login";

    // Avoid redirect loops for API routes
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL(`/${firmSlug}/login`, req.url);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - Static files (_next/static, _next/image, favicon, etc.)
     * - The root landing page (/)
     */
    "/((?!_next/static|_next/image|favicon.ico|$).*)",
  ],
};
