import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as TaskService from "@/services/task.service";
import { requireFeature } from "@/services/feature.service";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (ctx, req, context: any) => {
  await requireFeature(ctx, "TASKS");
  const taskId = (await context.params).taskId;
  const task = await TaskService.getTaskById(ctx, taskId);
  return NextResponse.json(task);
});

export const PATCH = withAuth(async (ctx, req, context: any) => {
  await requireFeature(ctx, "TASKS");
  const data = await req.json();
  
  const taskId = (await context.params).taskId;
  
  // SECURITY: Strict field whitelisting based on role
  const isAdmin = ctx.role === 'admin' || ctx.role === 'super_admin';
  const isTeamLead = ctx.role === 'team_lead';
  
  let safeData: any = {};
  
  if (data.status !== undefined) {
    try {
      if (data.status === 'in_progress') {
        await TaskService.startTask(ctx, taskId);
      } else if (data.status === 'submitted_for_review') {
        await TaskService.submitTaskForReview(ctx, taskId);
      } else if (data.status === 'approved') {
        await TaskService.approveTaskSequence(ctx, taskId);
      } else {
        if (isAdmin || isTeamLead) {
          safeData.status = data.status;
        } else {
          return NextResponse.json({ error: "Unauthorized status transition" }, { status: 403 });
        }
      }
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
  }

  // Admin can update most things
  if (isAdmin) {
    safeData = { ...data, ...safeData }; 
  } else if (isTeamLead) {
    const allowed = ['title', 'description', 'priority', 'dueDate', 'tags', 'stageId', 'assigneeId', 'status'];
    for (const key of allowed) {
      if (data[key] !== undefined) safeData[key] = data[key];
    }
  } else {
    const allowed = ['title', 'description', 'tags'];
    for (const key of allowed) {
      if (data[key] !== undefined) safeData[key] = data[key];
    }
    const protectedFields = ['assigneeId', 'assignerId', 'reviewerId', 'projectId', 'stageId', 'approvalStatus', 'dueDate'];
    for (const p of protectedFields) {
      if (data[p] !== undefined) {
        return NextResponse.json({ error: `Unauthorized to mutate protected field: ${p}` }, { status: 403 });
      }
    }
  }

  const task = await TaskService.updateTask(ctx, taskId, safeData);
  return NextResponse.json(task);
});

export const DELETE = withAuth(async (ctx, req, context: any) => {
  await requireFeature(ctx, "TASKS");
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "archive";
  
  const taskId = (await context.params).taskId;
  if (mode === "hard") {
    await TaskService.deleteTask(ctx, taskId);
    return NextResponse.json({ success: true, deleted: true });
  } else {
    const task = await TaskService.archiveTask(ctx, taskId);
    return NextResponse.json(task);
  }
});
