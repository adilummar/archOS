import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as AttendanceService from "@/services/attendance.service";

export const POST = withAuth(async (ctx, req) => {
  const { sessionId, type } = await req.json();
  const data = await AttendanceService.takeBreak(ctx, sessionId);
  return NextResponse.json(data);
});
