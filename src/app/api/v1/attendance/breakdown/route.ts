import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as AttendanceService from "@/services/attendance.service";

export const GET = withAuth(async (ctx, req) => {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  const data = await AttendanceService.getTaskTimeBreakdown(ctx, sessionId);
  return NextResponse.json(data);
});
