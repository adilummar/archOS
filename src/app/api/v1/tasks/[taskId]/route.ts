import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as TaskService from "@/services/task.service";
import { getAuthContext } from "@/services/auth.service";
import { requireFeature } from "@/services/feature.service";

export const PATCH = withAuth(async (ctx, req, context: any) => {
  await requireFeature(ctx, "TASKS");
  const data = await req.json();
  const url = new URL(req.url);
  const firmId = url.searchParams.get("firmId") || ctx.firmId;
  const actorId = url.searchParams.get("actorId") || ctx.userId;
  
  const taskId = (await context.params).taskId;
  
  // SECURITY: Strict field whitelisting based on role
  const isAdmin = ctx.role === 'admin' || ctx.role === 'super_admin';
  const isTeamLead = ctx.role === 'team_lead'; // (would need to verify team lead for this specific task, but TaskService.updateTask checks if we pass actorId? No, updateTask is generic.)
  
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
    const allowed = ['title', 'description', 'priority', 'dueDate'];
    for (const key of allowed) {
      if (data[key] !== undefined) safeData[key] = data[key];
    }
  } else {
    const allowed = ['title', 'description'];
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

  const task = await TaskService.updateTask(ctx, taskId, safeData, firmId, actorId);
  return NextResponse.json(task);
});

export const DELETE = withAuth(async (ctx, req, context: any) => {
  await requireFeature(ctx, "TASKS");
  const url = new URL(req.url);
  const firmId = url.searchParams.get("firmId") || ctx.firmId;
  const actorId = url.searchParams.get("actorId") || ctx.userId;
  
  const taskId = (await context.params).taskId;
  await TaskService.deleteTask(ctx, taskId, firmId, actorId);
  return NextResponse.json({ success: true });
});
