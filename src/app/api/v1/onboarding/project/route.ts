import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/services/auth.service";
import { withAuthTx } from "@/lib/db-tx";

export async function POST(req: NextRequest) {
  try {
    const session = await import("@/lib/session").then(m => m.getSession());
    if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const ctx = await getAuthContext(session.userId);
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
