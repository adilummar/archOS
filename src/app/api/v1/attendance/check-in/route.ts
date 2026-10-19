import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as AttendanceService from "@/services/attendance.service";

export const POST = withAuth(async (ctx, req) => {
  try {
    const body = await req.json();
    const data = await AttendanceService.checkIn(ctx, { 
      projectId: body.projectId, 
      taskId: body.taskId 
    });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Check-in error:', error);
    
    // Map business error codes to HTTP statuses
    let status = 500;
    if (error.code === 'MISSING_FIELD') status = 400;
    else if (error.code === 'UNAUTHORIZED' || error.message === 'Unauthorized') status = 401;
    else if (error.code === 'FORBIDDEN') status = 403;
    else if (error.code === 'NOT_FOUND') status = 404;
    else if (error.code === 'CONFLICT' || error.code === 'ALREADY_CHECKED_IN' || error.code === 'SEGMENT_CONFLICT') status = 409;
    
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' }, 
      { status }
    );
  }
});

