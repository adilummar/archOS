"use server";
import { getSession } from "@/lib/session";
import { getAuthContext } from "@/services/auth.service";
import { revalidatePath } from "next/cache";
import * as Service from "@/services/bootstrap.service";

async function getCtx() {
  const session = await getSession();
  if (!session.userId) throw new Error("Unauthorized");
  return getAuthContext(session.userId);
}

export async function getFirmBySlug(firmSlug: string) {
  const ctx = await getCtx();
  const result = await Service.getFirmBySlug(ctx, firmSlug);
  return result;
}

export async function getStaffByFirm(firmId: string) {
  const ctx = await getCtx();
  const result = await Service.getStaffByFirm(ctx, firmId);
  return result;
}

export async function getProjectsByFirm(firmId: string) {
  const ctx = await getCtx();
  const result = await Service.getProjectsByFirm(ctx, firmId);
  console.log("DEBUG PROJECTS:", result.map(p => ({ id: p.id, name: p.name, status: p.status })));
  return result;
}

export async function getProjectWithTasks(projectId: string) {
  const ctx = await getCtx();
  const result = await Service.getProjectWithTasks(ctx, projectId);
  return result;
}

