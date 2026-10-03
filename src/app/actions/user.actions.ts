"use server";
import { getSession } from "@/lib/session";
import { getAuthContext } from "@/services/auth.service";
import { requireFeature } from "@/services/feature.service";
import { revalidatePath } from "next/cache";
import * as Service from "@/services/user.service";

async function getCtx() {
  const session = await getSession();
  if (!session.userId) throw new Error("Unauthorized");
  const ctx = await getAuthContext(session.userId);
  await requireFeature(ctx, "STAFF");
  return ctx;
}

export async function getStaff(firmId: string) {
  const ctx = await getCtx();
  const result = await Service.getStaff(ctx, firmId);
  return result;
}

export async function getUser(userId: string) {
  const ctx = await getCtx();
  const result = await Service.getUser(ctx, userId);
  return result;
}

export async function createUser(data: {
  firmId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  designation?: string;
  costRatePerHour?: number;
}) {
  const ctx = await getCtx();
  const result = await Service.createUser(ctx, data);
  return result;
}

export async function updateUser(userId: string,
  data: Partial<{
    name: string;
    phone: string;
    role: string;
    designation: string;
    costRatePerHour: number;
    status: string;
    discontinuedAt: Date;
  }>
) {
  const ctx = await getCtx();
  const result = await Service.updateUser(ctx, userId, data);
  return result;
}

export async function getProjectStaff(projectId: string) {
  const ctx = await getCtx();
  const result = await Service.getProjectStaff(ctx, projectId);
  return result;
}

