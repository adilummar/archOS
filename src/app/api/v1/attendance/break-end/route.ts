import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as AttendanceService from "@/services/attendance.service";

export const POST = withAuth(async (ctx, req) => {
  const { sessionId } = await req.json();
  const res = await AttendanceService.resumeWork(ctx, sessionId);
  return NextResponse.json(res);
});
