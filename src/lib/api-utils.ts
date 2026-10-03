import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAuthContext, AuthContext } from "@/services/auth.service";

export function withAuth(
  handler: (ctx: AuthContext, req: NextRequest | Request, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: Request, ...args: any[]) => {
    try {
      const session = await getSession();
      if (!session.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const ctx = await getAuthContext(session.userId);
      return await handler(ctx, req, ...args);
    } catch (error: any) {
      console.error("API Error:", error);
      const msg = error.message || "";
      
      if (msg === "Unauthorized" || msg.includes("Unauthorized") || msg.includes("Forbidden")) {
        return NextResponse.json({ error: msg }, { status: 403 });
      }
      if (msg === "USER_DEACTIVATED") {
        return NextResponse.json({ error: "User is deactivated" }, { status: 403 });
      }
      if (msg === "FIRM_SUSPENDED") {
        return NextResponse.json({ error: "Firm suspended" }, { status: 403 });
      }
      if (msg.startsWith("FEATURE_DISABLED")) {
        return NextResponse.json({ error: "Feature not enabled for this firm" }, { status: 403 });
      }
      if (msg.toLowerCase().includes("not found")) {
        return NextResponse.json({ error: msg }, { status: 404 });
      }
      if (
        msg.toLowerCase().includes("validation") ||
        msg.toLowerCase().includes("required") ||
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("cannot") ||
        msg.toLowerCase().includes("must be") ||
        msg.toLowerCase().includes("lead time") ||
        msg.toLowerCase().includes("not a member") ||
        msg.toLowerCase().includes("assignee")
      ) {
        return NextResponse.json({ error: msg }, { status: 422 });
      }
      if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
      }
      if (msg.toLowerCase().includes('conflict') || msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('unique constraint')) {
        return NextResponse.json({ error: msg }, { status: 409 });
      }

      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}



