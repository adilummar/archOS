import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import bcrypt from "bcryptjs";
import { platformPrisma } from "@/lib/platform-db";

export const PATCH = withAuth(async (ctx, req: any) => {
  if (ctx.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { oldPassword, newPassword } = await req.json();

  const user = await platformPrisma.user.findUnique({ where: { id: ctx.userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.passwordHash) {
    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) return NextResponse.json({ error: "Incorrect temporary password" }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  // Use platformPrisma to update password hash. Safe because context user id is authenticated.
  await platformPrisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash }
  });

  return NextResponse.json({ success: true });
});
