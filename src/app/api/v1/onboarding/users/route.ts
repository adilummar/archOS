import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/services/auth.service";
import { withAuthTx } from "@/lib/db-tx";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await import("@/lib/session").then(m => m.getSession());
    if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const ctx = await getAuthContext(session.userId);
    if (ctx.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { users } = await req.json(); // Array of { name, email, role }

    const createdUsers: any[] = [];
    
    await withAuthTx(ctx, async (tx) => {
      for (const u of users) {
        if (!u.email || !u.name || !u.role) continue;
        
        const tempPassword = crypto.randomBytes(4).toString("hex"); // 8 chars
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        
        const newUser = await tx.user.create({
          data: {
            firmId: ctx.firmId,
            name: u.name,
            email: u.email.toLowerCase().trim(),
            role: u.role,
            passwordHash,
            status: "active"
          }
        });
        
        createdUsers.push({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, tempPassword });
      }
    });

    return NextResponse.json({ success: true, data: createdUsers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
