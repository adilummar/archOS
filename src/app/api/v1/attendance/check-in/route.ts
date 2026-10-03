import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as AttendanceService from "@/services/attendance.service";

export const POST = withAuth(async (ctx, req) => {
  const body = await req.json();
  const data = await AttendanceService.checkIn(ctx, { userId: ctx.userId, firmId: ctx.firmId, projectId: body.projectId, taskId: body.taskId });
  return NextResponse.json(data);
});

