import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-utils';
import * as TaskService from '@/services/task.service';

export const POST = withAuth(async (ctx, req, context: any) => {
  const { taskId } = await context.params;
  const task = await TaskService.approveTaskSequence(ctx, taskId);
  return NextResponse.json(task);
});
