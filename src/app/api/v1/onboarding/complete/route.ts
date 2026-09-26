import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/services/auth.service";
import { withAuthTx } from "@/lib/db-tx";

export async function POST(req: NextRequest) {
  try {
    const session = await import("@/lib/session").then(m => m.getSession());
    if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const ctx = await getAuthContext(session.userId);
    if (ctx.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await withAuthTx(ctx, async (tx) => {
      await tx.firm.update({
        where: { id: ctx.firmId },
        data: { onboardingState: "COMPLETED" }
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
