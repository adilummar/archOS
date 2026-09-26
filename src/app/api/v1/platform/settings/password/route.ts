import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { platformPrisma } from "@/lib/platform-db";
import { requirePlatformAuth } from "@/services/platform.service";

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requirePlatformAuth();
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 401 });
    }

    // Hash new password and save
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await platformPrisma.platformAdmin.update({
      where: { id: admin.id },
      data: { passwordHash }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    console.error("Password update error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
