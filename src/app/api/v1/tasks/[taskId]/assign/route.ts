import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-utils';
import * as TaskService from '@/services/task.service';
import { requireFeature } from '@/services/feature.service';

function parseOptionalDueDate(dueDate: unknown): Date | null {
  if (dueDate == null || dueDate === "") return null;
  const parsed = new Date(dueDate as string);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid due date");
  }
  return parsed;
}

export const POST = withAuth(async (ctx, req, context: any) => {
  await requireFeature(ctx, "TASKS");
  const { taskId } = await context.params;
  const { dueDate, assigneeId, priority } = await req.json();
  const parsedDate = parseOptionalDueDate(dueDate);
  const task = await TaskService.assignActiveTask(ctx, taskId, parsedDate, assigneeId, priority);
  return NextResponse.json(task);
});
