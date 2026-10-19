import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as AttendanceService from "@/services/attendance.service";

export const POST = withAuth(async (ctx, req) => {
  try {
    const body = await req.json();
    const res = await AttendanceService.switchTask(ctx, {
      projectId: body.projectId,
      taskId: body.taskId,
    });
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("Switch task error:", error);

    let status = 500;
    if (error.code === "MISSING_FIELD") status = 400;
    else if (error.code === "UNAUTHORIZED") status = 401;
    else if (error.code === "FORBIDDEN") status = 403;
    else if (error.code === "NOT_FOUND") status = 404;
    else if (
      error.code === "CONFLICT" ||
      error.code === "NOT_CHECKED_IN" ||
      error.code === "ON_BREAK" ||
      error.code === "SEGMENT_CONFLICT"
    )
      status = 409;

    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status }
    );
  }
});
