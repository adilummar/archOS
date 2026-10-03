import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as StaffService from "@/services/staff.service";
import * as UserService from "@/services/user.service";
import { requireFeature } from "@/services/feature.service";
import bcrypt from "bcryptjs";

export const GET = withAuth(async (ctx, req, context: any) => {
  await requireFeature(ctx, "STAFF");
  const { id } = await context.params;
  const data = await StaffService.getStaffProfile(ctx, id);
  return NextResponse.json(data);
});

export const PATCH = withAuth(async (ctx, req, context: any) => {
  await requireFeature(ctx, "STAFF");
  const { id } = await context.params;
  const data = await req.json();

  if (data.action === "suspend") {
    const res = await UserService.updateUser(ctx, id, { status: "discontinued" });
    return NextResponse.json(res);
  }
  
  if (data.action === "unsuspend") {
    const res = await UserService.updateUser(ctx, id, { status: "active" });
    return NextResponse.json(res);
  }

  if (data.action === "password") {
    // Password change logic from the old staff.actions.ts
    if (ctx.role !== "admin") throw new Error("Forbidden: Only admins can change staff passwords");
    if (data.password.length < 6) throw new Error("Password must be at least 6 characters");
    
    // Instead of raw prisma here, we can pass passwordHash to updateUser if supported,
    // but updateUser might not allow passwordHash directly. Let's see.
    // UserService.updateUser uses data to update User.
    const passwordHash = await bcrypt.hash(data.password, 10);
    const res = await UserService.updateUser(ctx, id, { passwordHash });
    return NextResponse.json(res);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
});

