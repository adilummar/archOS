import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as TaskService from "@/services/task.service";

export const POST = withAuth(async (ctx, req, context: any) => {
  const data = await req.json();
  const task = await TaskService.assignTaskWithOverride(ctx, {
    ...data,
    taskId: (await context.params).taskId,
    requestedDueDate: new Date(data.requestedDueDate)
  });
  return NextResponse.json(task);
});

