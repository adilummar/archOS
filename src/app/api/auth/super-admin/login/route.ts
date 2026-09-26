import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { platformPrisma } from "@/lib/platform-db";
import { getPlatformSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const admin = await platformPrisma.platformAdmin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!admin || !admin.active) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const session = await getPlatformSession();
    session.platformAdminId = admin.id;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
