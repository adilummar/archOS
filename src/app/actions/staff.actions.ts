"use server";
import { getSession } from "@/lib/session";
import { getAuthContext } from "@/services/auth.service";
import { revalidatePath } from "next/cache";
import * as Service from "@/services/staff.service";

async function getCtx() {
  const session = await getSession();
  if (!session.userId) throw new Error("Unauthorized");
  return getAuthContext(session.userId);
}

export async function getStaffWithAttendance(firmId: string, userEmail?: string) {
  const ctx = await getCtx();
  const result = await Service.getStaffWithAttendance(ctx, firmId, userEmail);
  return result;
}

export async function getTeamLeadStaffWithAttendance(leadId: string, userEmail?: string) {
  const ctx = await getCtx();
  const result = await Service.getTeamLeadStaffWithAttendance(ctx, leadId, userEmail);
  return result;
}

export async function getStaffProfile(userId: string) {
  const ctx = await getCtx();
  const result = await Service.getStaffProfile(ctx, userId);
  return result;
}

