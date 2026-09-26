import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as TaskService from "@/services/task.service";

export const GET = withAuth(async (ctx, req) => {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const firmId = url.searchParams.get("firmId");
  const userId = url.searchParams.get("userId");
  
  if (projectId) {
    const tasks = await TaskService.getTasksByProject(ctx, projectId);
    return NextResponse.json(tasks);
  }
  
  if (userId) {
    const email = url.searchParams.get("userEmail") || undefined;
    const tasks = await TaskService.getTasksByUser(ctx, userId, firmId || ctx.firmId, email);
    return NextResponse.json(tasks);
  }
  
  // Default to all tasks by firm
  const tasks = await TaskService.getAllTasksByFirm(ctx, firmId || ctx.firmId);
  return NextResponse.json(tasks);
});

export const POST = withAuth(async (ctx, req) => {
  const data = await req.json();
  const task = await TaskService.createTask(ctx, data);
  return NextResponse.json(task, { status: 201 });
});
