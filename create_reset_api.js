const fs = require('fs');
const path = require('path');

const dir = 'src/app/api/v1/platform/firms/[firmId]/reset-password';
fs.mkdirSync(dir, { recursive: true });

const code = `import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { platformPrisma } from "@/lib/platform-db";
import { requirePlatformAuth } from "@/services/platform.service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ firmId: string }> }) {
  try {
    await requirePlatformAuth();
    const { userId, newPassword } = await req.json();
    const firmId = (await params).firmId;

    if (!userId || !newPassword) {
      return NextResponse.json({ error: "Missing userId or newPassword" }, { status: 400 });
    }

    // Verify user belongs to the firm
    const user = await platformPrisma.user.findFirst({
      where: { id: userId, firmId: firmId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found in this firm" }, { status: 404 });
    }

    // Hash new password and update
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await platformPrisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    console.error("User password reset error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
`;

fs.writeFileSync(path.join(dir, 'route.ts'), code);
console.log("Created reset-password API route");
