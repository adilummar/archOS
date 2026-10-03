import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as StaffService from "@/services/staff.service";
import * as UserService from "@/services/user.service";
import { requireFeature } from "@/services/feature.service";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (ctx, req) => {
  await requireFeature(ctx, "STAFF");
  if (ctx.role === "team_lead") {
    const data = await StaffService.getTeamLeadStaffWithAttendance(ctx, ctx.userId);
    return NextResponse.json(data);
  }
  const data = await StaffService.getStaffWithAttendance(ctx, ctx.firmId);
  return NextResponse.json(data);
});

export const POST = withAuth(async (ctx, req) => {
  await requireFeature(ctx, "STAFF");
  const data = await req.json();
  const newStaff = await UserService.createUser(ctx, data);
  return NextResponse.json(newStaff, { status: 201 });
});

