const fs = require('fs');
let c = fs.readFileSync('src/middleware.ts', 'utf8');

c = c.replace(/import \{ sessionOptions, type SessionData \} from "@\/lib\/session";/, 'import { sessionOptions, type SessionData, platformSessionOptions, type PlatformSessionData } from "@/lib/session";');

c = c.replace(/export async function middleware\(req: NextRequest\) \{[\s\S]*?const \{ pathname \} = req\.nextUrl;/, `export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Platform routes
  if (pathname.startsWith("/super-admin") || pathname.startsWith("/api/v1/platform")) {
    if (pathname === "/super-admin/login" || pathname === "/api/auth/super-admin/login") {
      return NextResponse.next();
    }
    const platformSession = await getIronSession<PlatformSessionData>(await cookies(), platformSessionOptions);
    if (!platformSession.platformAdminId) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/super-admin/login", req.url));
    }
    return NextResponse.next();
  }
`);

fs.writeFileSync('src/middleware.ts', c);
console.log("Updated middleware.ts");
