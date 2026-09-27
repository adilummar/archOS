import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-utils';
import * as TaskService from '@/services/task.service';

export const GET = withAuth(async (ctx) => {
  const tasks = await TaskService.getStaffAssignedTasks(ctx, ctx.userId);
  return NextResponse.json(tasks);
});
