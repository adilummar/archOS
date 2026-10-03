"use server";
import { getSession } from "@/lib/session";
import { getAuthContext } from "@/services/auth.service";
import { revalidatePath } from "next/cache";
import * as Service from "@/services/attendance.service";

async function getCtx() {
  const session = await getSession();
  if (!session.userId) throw new Error("Unauthorized");
  return getAuthContext(session.userId);
}

/** @deprecated Migrated to TanStack Query */
export async function getTodaySession(userId: string, email?: string) {
  const ctx = await getCtx();
  const result = await Service.getTodaySession(ctx, userId, email);
  return result;
}

/** @deprecated Migrated to TanStack Query */
export async function checkIn(data: {
  userId: string;
  email?: string;       // optional fallback for ID resolution
  firmId: string;
  projectId: string;
  taskId: string;
}) {
  const ctx = await getCtx();
  const result = await Service.checkIn(ctx, data);
  return result;
}

/** @deprecated Migrated to TanStack Query */
export async function switchTask(data: {
  sessionId: string;
  firmId: string;
  userId: string;
  newProjectId: string;
  newTaskId: string;
  markCurrentTaskDone: boolean;
}) {
  const ctx = await getCtx();
  const result = await Service.switchTask(ctx, data);
  return result;
}

/** @deprecated Migrated to TanStack Query */
export async function takeBreak(sessionId: string) {
  const ctx = await getCtx();
  const result = await Service.takeBreak(ctx, sessionId);
  return result;
}

/** @deprecated Migrated to TanStack Query */
export async function resumeWork(sessionId: string) {
  const ctx = await getCtx();
  const result = await Service.resumeWork(ctx, sessionId);
  return result;
}

/** @deprecated Migrated to TanStack Query */
export async function checkOut(sessionId: string) {
  const ctx = await getCtx();
  const result = await Service.checkOut(ctx, sessionId);
  return result;
}

/** @deprecated Migrated to TanStack Query */
export async function getAttendanceHistory(userId: string, limit = 30) {
  const ctx = await getCtx();
  const result = await Service.getAttendanceHistory(ctx, userId, limit = 30);
  return result;
}

/** @deprecated Migrated to TanStack Query */
export async function getFirmAttendance(firmId: string, date?: string) {
  const ctx = await getCtx();
  const result = await Service.getFirmAttendance(ctx, firmId, date);
  return result;
}

/** @deprecated Migrated to TanStack Query */
export async function getTaskTimeBreakdown(sessionId: string) {
  const ctx = await getCtx();
  const result = await Service.getTaskTimeBreakdown(ctx, sessionId);
  return result;
}

