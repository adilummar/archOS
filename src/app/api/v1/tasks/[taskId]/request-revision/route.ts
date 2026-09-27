import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-utils';
import * as TaskService from '@/services/task.service';

export const POST = withAuth(async (ctx, req, context: any) => {
  const { taskId } = await context.params;
  const { remark, newDueDate } = await req.json();
  const task = await TaskService.requestTaskRevisionSequence(ctx, taskId, remark, new Date(newDueDate));
  return NextResponse.json(task);
});
