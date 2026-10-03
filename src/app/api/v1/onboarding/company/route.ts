import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import { withAuthTx } from "@/lib/db-tx";

export const PATCH = withAuth(async (ctx, req: any) => {
  if (ctx.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json();

  // Strip forbidden fields from being updated (e.g., firmId, slug)
  // Slug is immutable by tenant ADMIN as per phase requirements: "Do NOT make slug casually editable if that would break existing tenant URLs"
  // Status, onboardingState, etc. must not be updated here.

  await withAuthTx(ctx, async (tx) => {
    const firm = await tx.firm.findUnique({ where: { id: ctx.firmId } });
    
    await tx.firm.update({
      where: { id: ctx.firmId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        address: data.address !== undefined ? data.address : undefined,
        onboardingState: firm?.onboardingState === "NOT_STARTED" ? "IN_PROGRESS" : undefined
      }
    });
  });

  return NextResponse.json({ success: true });
});
