import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as LeaveService from "@/services/leave.service";
import { requireFeature } from "@/services/feature.service";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (ctx, req) => {
  await requireFeature(ctx, "STAFF");
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const month = searchParams.get("month") || undefined;
  const userId = searchParams.get("userId") || undefined;

  const data = await LeaveService.getLeaveRequests(ctx, { status, month, userId });
  return NextResponse.json(data);
});

export const POST = withAuth(async (ctx, req) => {
  await requireFeature(ctx, "STAFF");
  const body = await req.json();
  const created = await LeaveService.createLeaveRequest(ctx, body);
  return NextResponse.json(created, { status: 201 });
});
