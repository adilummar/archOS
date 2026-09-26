import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as TaskService from "@/services/task.service";

export const PATCH = withAuth(async (ctx, req, context: any) => {
  const data = await req.json();
  const url = new URL(req.url);
  const firmId = url.searchParams.get("firmId") || ctx.firmId;
  const actorId = url.searchParams.get("actorId") || ctx.userId;
  
  const taskId = (await context.params).taskId;
  const task = await TaskService.updateTask(ctx, taskId, data, firmId, actorId);
  return NextResponse.json(task);
});

export const DELETE = withAuth(async (ctx, req, context: any) => {
  const url = new URL(req.url);
  const firmId = url.searchParams.get("firmId") || ctx.firmId;
  const actorId = url.searchParams.get("actorId") || ctx.userId;
  
  const taskId = (await context.params).taskId;
  await TaskService.deleteTask(ctx, taskId, firmId, actorId);
  return NextResponse.json({ success: true });
});
