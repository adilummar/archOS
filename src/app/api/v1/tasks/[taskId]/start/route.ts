import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as TaskService from "@/services/task.service";
import { requireFeature } from "@/services/feature.service";

export const POST = withAuth(async (ctx: any, req: any, context: any) => {
  await requireFeature(ctx, "TASKS");
  const { taskId } = await context.params;
  const task = await TaskService.startTask(ctx, taskId);
  return NextResponse.json(task);
});
