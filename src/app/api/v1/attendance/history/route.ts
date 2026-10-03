import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as AttendanceService from "@/services/attendance.service";

export const GET = withAuth(async (ctx, req) => {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  const data = await AttendanceService.getAttendanceHistory(ctx, userId, 14);
  return NextResponse.json(data);
});
