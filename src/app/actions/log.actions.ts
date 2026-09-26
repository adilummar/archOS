"use server";
import { getSession } from "@/lib/session";
import { getAuthContext } from "@/services/auth.service";
import { revalidatePath } from "next/cache";
import * as Service from "@/services/log.service";

async function getCtx() {
  const session = await getSession();
  if (!session.userId) throw new Error("Unauthorized");
  return getAuthContext(session.userId);
}

export async function getGlobalLogs(firmId: string, limit = 100) {
  const ctx = await getCtx();
  const result = await Service.getGlobalLogs(ctx, firmId, limit = 100);
  return result;
}

export async function getProjectLogs(projectId: string, limit = 100) {
  const ctx = await getCtx();
  const result = await Service.getProjectLogs(ctx, projectId, limit = 100);
  return result;
}

export async function getUserLogs(userId: string, firmId: string, limit = 50) {
  const ctx = await getCtx();
  const result = await Service.getUserLogs(ctx, userId, firmId, limit = 50);
  return result;
}

export async function getUserLogsByDate(userId: string, dateStr: string) {
  const ctx = await getCtx();
  const result = await Service.getUserLogsByDate(ctx, userId, dateStr);
  return result;
}

export async function createLog(data: {
  firmId: string;
  userId?: string;
  projectId?: string;
  entity: string;
  entityId: string;
  action: string;
  description: string;
}) {
  const ctx = await getCtx();
  const result = await Service.createLog(ctx, data);
  return result;
}

export async function startTimeLog(data: {
  firmId: string;
  userId: string;
  projectId: string;
  phase?: string;
  notes?: string;
}) {
  const ctx = await getCtx();
  const result = await Service.startTimeLog(ctx, data);
  return result;
}

export async function stopTimeLog(timeLogId: string) {
  const ctx = await getCtx();
  const result = await Service.stopTimeLog(ctx, timeLogId);
  return result;
}

export async function getTimeLogsByProject(projectId: string) {
  const ctx = await getCtx();
  const result = await Service.getTimeLogsByProject(ctx, projectId);
  return result;
}

export async function getTimeLogsByUser(userId: string, firmId: string) {
  const ctx = await getCtx();
  const result = await Service.getTimeLogsByUser(ctx, userId, firmId);
  return result;
}

export async function getLogStats(firmId: string) {
  const ctx = await getCtx();
  const result = await Service.getLogStats(ctx, firmId);
  return result;
}

