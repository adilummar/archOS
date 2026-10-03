import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-utils';
import * as TaskService from '@/services/task.service';

export const POST = withAuth(async (ctx, req, context: any) => {
  const { taskId } = await context.params;
  const { remark, newDueDate } = await req.json();
  let parsedDue: Date | null = null;
  if (newDueDate != null && newDueDate !== "") {
    parsedDue = new Date(newDueDate);
    if (Number.isNaN(parsedDue.getTime())) {
      throw new Error("Invalid due date");
    }
  }
  const task = await TaskService.requestTaskRevisionSequence(ctx, taskId, remark, parsedDue);
  return NextResponse.json(task);
});
