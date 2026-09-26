import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as TaskService from "@/services/task.service";

export const POST = withAuth(async (ctx, req, context: any) => {
  const data = await req.json();
  const task = await TaskService.reviewTask(
    ctx, 
    (await context.params).taskId, 
    data.reviewerId, 
    data.firmId, 
    {
      approvalStatus: data.approvalStatus,
      approvalNote: data.approvalNote,
      newDueDate: data.newDueDate ? new Date(data.newDueDate) : undefined
    }
  );
  return NextResponse.json(task);
});

