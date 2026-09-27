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

export async function addStaffMember(data: {
  firmId: string;
  name: string;
  email: string;
  password: string;
  role: string;
  designation?: string;
  phone?: string;
  costRatePerHour?: number;
}) {
  const ctx = await getCtx();
  // Verify caller is admin
  const caller = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { role: true, firmId: true } });
  if (!caller || caller.role !== "admin") throw new Error("Only admins can add staff");

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
  if (existing) throw new Error("A user with this email already exists");

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      firmId: data.firmId,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      passwordHash,
      role: data.role,
      designation: data.designation || null,
      phone: data.phone || null,
      costRatePerHour: data.costRatePerHour || 0,
      status: "active",
      avatarInitials: data.name.slice(0, 2).toUpperCase(),
      avatarColor: "#E85D04",
    },
    select: { id: true, name: true, email: true, role: true, status: true, designation: true },
  });

  revalidatePath("/[firmSlug]/staff", "page");
  return user;
}

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
