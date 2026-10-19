/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAuthContext, AuthContext } from "@/services/auth.service";

export function withAuth(
  handler: (ctx: AuthContext, req: NextRequest | Request, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: Request, ...args: any[]) => {
    try {
      let userId: string | null = null;
      try {
        const session = await getSession();
        userId = session?.userId || null;
      } catch (err: any) {
        if (process.env.NODE_ENV !== "production") {
          const testHeader = req.headers?.get?.("x-test-user-id");
          if (testHeader) {
            userId = testHeader;
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const ctx = await getAuthContext(userId);
      return await handler(ctx, req, ...args);
    } catch (error: any) {
      console.error("API Error:", error);
      const msg = error.message || "";
      
      if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
      }

      // Check explicit status code attached to application/domain error
      const explicitStatus = Number(error.statusCode || error.status);
      if (
        !Number.isNaN(explicitStatus) &&
        (explicitStatus === 400 ||
          explicitStatus === 401 ||
          explicitStatus === 403 ||
          explicitStatus === 404 ||
          explicitStatus === 409 ||
          explicitStatus === 422)
      ) {
        const isDbLeak = /prisma|select|insert|update|delete|table|column|relation|database|stack/i.test(msg);
        const safeMsg = isDbLeak ? "An application request error occurred" : (msg || "Request error");
        return NextResponse.json({ error: safeMsg }, { status: explicitStatus });
      }

      // Check known error codes
      if (error.code === "CONFLICT" || error.code === "P2002" || error.code === "ALREADY_CHECKED_IN" || error.code === "SEGMENT_CONFLICT") {
        return NextResponse.json({ error: msg && !/prisma/i.test(msg) ? msg : "A resource conflict occurred" }, { status: 409 });
      }
      if (error.code === "NOT_FOUND" || error.code === "P2025") {
        return NextResponse.json({ error: msg && !/prisma/i.test(msg) ? msg : "Resource not found" }, { status: 404 });
      }
      if (error.code === "FORBIDDEN") {
        return NextResponse.json({ error: msg && !/prisma/i.test(msg) ? msg : "Forbidden" }, { status: 403 });
      }
      if (error.code === "UNAUTHORIZED") {
        return NextResponse.json({ error: msg && !/prisma/i.test(msg) ? msg : "Unauthorized" }, { status: 401 });
      }
      if (error.code === "VALIDATION_ERROR" || error.code === "MISSING_FIELD") {
        return NextResponse.json({ error: msg && !/prisma/i.test(msg) ? msg : "Validation error" }, { status: 422 });
      }

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



