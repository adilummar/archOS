import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import { withAuthTx } from "@/lib/db-tx";

export const POST = withAuth(async (ctx, req: any) => {
  if (ctx.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return await withAuthTx(ctx, async (tx) => {
    const firm = await tx.firm.findUnique({
      where: { id: ctx.firmId }
    });

    if (!firm) {
      return NextResponse.json({ error: "Firm not found" }, { status: 404 });
    }

    if (firm.onboardingState === "COMPLETED") {
      // Idempotent: safe to call twice
      return NextResponse.json({ success: true, message: "Already completed" });
    }

    // Verify required conditions
    if (!firm.name || firm.name.trim() === "") {
      return NextResponse.json({ error: "Firm name is required" }, { status: 400 });
    }
    if (!firm.address || firm.address === "TBD" || firm.address.trim() === "") {
      return NextResponse.json({ error: "Firm address is required" }, { status: 400 });
    }
    if (!firm.phone || firm.phone === "TBD" || firm.phone.trim() === "") {
      return NextResponse.json({ error: "Firm phone is required" }, { status: 400 });
    }

    await tx.firm.update({
      where: { id: ctx.firmId },
      data: { onboardingState: "COMPLETED" }
    });

    return NextResponse.json({ success: true });
  });
});
