import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAuthContext, AuthContext } from "@/services/auth.service";

export function withAuth(
  handler: (ctx: AuthContext, req: Request, ...args: any[]) => Promise<NextResponse>
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
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.json(
        { error: error.message || "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}

