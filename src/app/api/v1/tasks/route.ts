import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as TaskService from "@/services/task.service";
import { getAuthContext } from "@/services/auth.service";
import { requireFeature } from "@/services/feature.service";

export const GET = withAuth(async (ctx, req) => {
  await requireFeature(ctx, "TASKS");
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
  let tasks = [];
  if (ctx.role === 'admin' || ctx.role === 'super_admin' || ctx.role === 'accounts') {
     tasks = await TaskService.getAllTasksByFirm(ctx, firmId || ctx.firmId);
  } else if (ctx.role === 'team_lead') {
     const active = await TaskService.getTeamLeadActiveTasks(ctx, ctx.userId);
     const review = await TaskService.getTeamLeadReviewQueue(ctx, ctx.userId);
     const assigned = await TaskService.getStaffAssignedTasks(ctx, ctx.userId);
     const map = new Map();
     active.forEach((t) => map.set(t.id, t));
     review.forEach((t) => map.set(t.id, t));
     assigned.forEach((t) => map.set(t.id, t));
     tasks = Array.from(map.values());
  } else {
     tasks = await TaskService.getStaffAssignedTasks(ctx, ctx.userId);
  }
  return NextResponse.json(tasks);
});

export const POST = withAuth(async (ctx, req) => {
  await requireFeature(ctx, "TASKS");
  const data = await req.json();
  const task = await TaskService.createTask(ctx, data);
  return NextResponse.json(task, { status: 201 });
});
