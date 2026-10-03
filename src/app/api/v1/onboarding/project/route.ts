import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import { withAuthTx } from "@/lib/db-tx";

export const POST = withAuth(async (ctx, req: any) => {
  if (ctx.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, teamLeadId } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  let project;
  await withAuthTx(ctx, async (tx) => {
    project = await tx.project.create({
      data: {
        firmId: ctx.firmId,
        name,
        status: "active",
        teamLeadId: teamLeadId || null
      }
    });
  });

  return NextResponse.json({ success: true, data: project });
});
