/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as TaskService from "@/services/task.service";
import { requireFeature } from "@/services/feature.service";

export const dynamic = "force-dynamic";

export const PATCH = withAuth(async (ctx, req, context: any) => {
  await requireFeature(ctx, "TASKS");
  const subtaskId = (await context.params).subtaskId;
  let completed: boolean | undefined;
  try {
    const body = await req.json();
    if (typeof body?.completed === "boolean") {
      completed = body.completed;
    }
  } catch {
    // Invert completion if body is omitted or lacks explicit boolean
  }

  const updated = await TaskService.toggleSubtask(ctx, subtaskId, completed);
  return NextResponse.json(updated);
});

export const DELETE = withAuth(async (ctx, req, context: any) => {
  await requireFeature(ctx, "TASKS");
  const subtaskId = (await context.params).subtaskId;
  const result = await TaskService.deleteSubtask(ctx, subtaskId);
  return NextResponse.json(result);
});
