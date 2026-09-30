"use server";
import { getSession } from "@/lib/session";
import { getAuthContext } from "@/services/auth.service";
import { revalidatePath } from "next/cache";
import * as Service from "@/services/task.service";

async function getCtx() {
  const session = await getSession();
  if (!session.userId) throw new Error("Unauthorized");
  return getAuthContext(session.userId);
}

export async function getTasksByProject(projectId: string) {
  const ctx = await getCtx();
  const result = await Service.getTasksByProject(ctx, projectId);
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

export async function getAllTasksByFirm(firmId: string) {
  const ctx = await getCtx();
  const result = await Service.getAllTasksByFirm(ctx, firmId);
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

export async function getTasksByUser(userId: string, firmId: string, userEmail?: string) {
  const ctx = await getCtx();
  const result = await Service.getTasksByUser(ctx, userId, firmId, userEmail);
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

export async function getTasksByFirm(firmId: string) {
  const ctx = await getCtx();
  const result = await Service.getAllTasksByFirm(ctx, firmId);
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

export async function createTask(data: {
  firmId: string;
  projectId: string;
  stageId?: string;
  assigneeId?: string;
  assignerId: string;
  title: string;
  description?: string;
  priority?: string;
  dueDate?: Date;
  startDate?: Date;
  tags?: string[];
}) {
  const ctx = await getCtx();
  const result = await Service.createTask(ctx, data);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

export async function updateTask(taskId: string,
  data: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    assigneeId?: string;
    dueDate: Date;
    startDate: Date;
    stageId: string;
    isBlocked: boolean;
    blockedReason: string;
    approvalStatus: string;
    approvalNote: string;
    approvedById: string;
    completedAt: Date;
    tags: string[];
  }>,
  firmId: string,
  actorId?: string
) {
  const ctx = await getCtx();
  const result = await Service.updateTask(ctx, taskId, data, firmId, actorId!);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

export async function deleteTask(taskId: string, firmId: string, actorId?: string) {
  const ctx = await getCtx();
  const result = await Service.deleteTask(ctx, taskId, firmId, actorId!);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

export async function addSubtask(data: {
  taskId: string;
  title: string;
  createdById: string;
  assignedToId?: string;
}) {
  const ctx = await getCtx();
  const result = await Service.addSubtask(ctx, data);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

export async function toggleSubtask(subtaskId: string, completed: boolean) {
  const ctx = await getCtx();
  const result = await Service.toggleSubtask(ctx, subtaskId, completed);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

export async function reviewTask(taskId: string,
  reviewerId: string,
  firmId: string,
  data: {
    approvalStatus: "approved" | "revision_requested";
    approvalNote: string;
    newDueDate?: Date;
  }
) {
  const ctx = await getCtx();
  const result = await Service.reviewTask(ctx, taskId, reviewerId, firmId, data);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

export async function assignTaskWithOverride(data: {
  firmId: string;
  taskId: string;
  assigneeId: string;
  requestedDueDate: Date;
  requiredLeadTimeDays: number;
  actualLeadTimeDays: number;
  reason: string;
}) {
  const ctx = await getCtx();
  const result = await Service.assignTaskWithOverride(ctx, data);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return JSON.parse(JSON.stringify(result)) as typeof result;
}






export async function assignActiveTask(taskId: string, dueDate: Date, assigneeId?: string) {
  const ctx = await getCtx();
  const result = await Service.assignActiveTask(ctx, taskId, dueDate, assigneeId);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

export async function submitTaskForReview(taskId: string) {
  const ctx = await getCtx();
  const result = await Service.submitTaskForReview(ctx, taskId);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

export async function startTask(taskId: string) {
  const ctx = await getCtx();
  const result = await Service.startTask(ctx, taskId);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

export async function requestTaskRevisionSequence(taskId: string, remark: string, newDueDate: Date) {
  const ctx = await getCtx();
  const result = await Service.requestTaskRevisionSequence(ctx, taskId, remark, newDueDate);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return JSON.parse(JSON.stringify(result)) as typeof result;
}

export async function approveTaskSequence(taskId: string) {
  const ctx = await getCtx();
  const result = await Service.approveTaskSequence(ctx, taskId);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return JSON.parse(JSON.stringify(result)) as typeof result;
}
