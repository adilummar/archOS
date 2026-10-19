"use server";
import { getSession } from "@/lib/session";
import { getAuthContext } from "@/services/auth.service";
import { revalidatePath } from "next/cache";
import * as Service from "@/services/staff.service";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

async function getCtx() {
  const session = await getSession();
  if (!session.userId) throw new Error("Unauthorized");
  return getAuthContext(session.userId);
}

/** @deprecated Migrated to TanStack Query */
export async function getStaffWithAttendance(firmId: string, userEmail?: string) {
  const ctx = await getCtx();
  const result = await Service.getStaffWithAttendance(ctx, firmId, userEmail);
  return result;
}

/** @deprecated Migrated to TanStack Query */
export async function getTeamLeadStaffWithAttendance(leadId: string, userEmail?: string) {
  const ctx = await getCtx();
  const result = await Service.getTeamLeadStaffWithAttendance(ctx, leadId, userEmail);
  return result;
}

/** @deprecated Migrated to TanStack Query */
export async function getStaffProfile(userId: string) {
  const ctx = await getCtx();
  const result = await Service.getStaffProfile(ctx, userId);
  return result;
}

/** @deprecated Migrated to TanStack Query. Use POST /api/v1/staff instead. */
export async function addStaffMember(data: any) {
  throw new Error("DEPRECATED: Use /api/v1/staff endpoint to create staff. This server action bypasses RLS and is disabled.");
}

/** @deprecated Migrated to TanStack Query */
export async function editStaffMember(
  userId: string,
  data: {
    name?: string;
    email?: string;
    designation?: string;
    role?: string;
    costRatePerHour?: number;
    phone?: string;
  }
) {
  const ctx = await getCtx();
  const caller = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { role: true, firmId: true } });
  if (!caller || caller.role !== "admin") throw new Error("Only admins can edit staff");

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { firmId: true } });
  if (!target || target.firmId !== caller.firmId) throw new Error("Staff member not found");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email?.toLowerCase().trim(),
      designation: data.designation,
      role: data.role,
      costRatePerHour: data.costRatePerHour,
      phone: data.phone,
    },
    select: { id: true, name: true, email: true, role: true, status: true, designation: true },
  });

  revalidatePath("/[firmSlug]/settings", "page");
  revalidatePath("/[firmSlug]/staff", "page");
  return updated;
}

/** @deprecated Migrated to TanStack Query */
export async function suspendStaffMember(staffId: string) {
  const ctx = await getCtx();
  const caller = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { role: true } });
  if (!caller || caller.role !== "admin") throw new Error("Only admins can suspend staff");

  const updated = await prisma.user.update({
    where: { id: staffId },
    data: { status: "discontinued", discontinuedAt: new Date() },
    select: { id: true, name: true, status: true },
  });

  revalidatePath("/[firmSlug]/staff", "page");
  return updated;
}

/** @deprecated Migrated to TanStack Query */
export async function unsuspendStaffMember(staffId: string) {
  const ctx = await getCtx();
  const caller = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { role: true } });
  if (!caller || caller.role !== "admin") throw new Error("Only admins can reinstate staff");

  const updated = await prisma.user.update({
    where: { id: staffId },
    data: { status: "active", discontinuedAt: null },
    select: { id: true, name: true, status: true },
  });

  revalidatePath("/[firmSlug]/staff", "page");
  return updated;
}

/** @deprecated Migrated to TanStack Query */
export async function changeStaffPassword(staffId: string, newPassword: string) {
  const ctx = await getCtx();
  const caller = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { role: true } });
  if (!caller || caller.role !== "admin") throw new Error("Only admins can change staff passwords");
  if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: staffId },
    data: { passwordHash },
  });

  return { ok: true };
}
