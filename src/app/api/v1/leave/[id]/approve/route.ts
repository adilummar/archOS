import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as LeaveService from "@/services/leave.service";

import { requireFeature } from "@/services/feature.service";

export const dynamic = "force-dynamic";

export const PATCH = withAuth(async (ctx, req, context: { params: Promise<{ id: string }> | { id: string } }) => {
  await requireFeature(ctx, "STAFF");
  const resolvedParams = await context.params;
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json({ error: "Missing leave request id" }, { status: 400 });
  }

  let note: string | undefined;
  try {
    const body = await req.json();
    note = body?.note;
  } catch {
    // Note is optional for approval
  }

  const result = await LeaveService.approveLeaveRequest(ctx, id, note);
  return NextResponse.json(result);
});
