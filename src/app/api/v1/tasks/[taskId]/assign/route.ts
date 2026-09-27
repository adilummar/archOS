import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-utils';
import * as TaskService from '@/services/task.service';

export const POST = withAuth(async (ctx, req, context: any) => {
  const { taskId } = await context.params;
  const { dueDate, assigneeId } = await req.json();
  const task = await TaskService.assignActiveTask(ctx, taskId, new Date(dueDate), assigneeId);
  return NextResponse.json(task);
});
