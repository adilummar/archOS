import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { platformPrisma } from "@/lib/platform-db";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // 1. Resolve user by email — never expose which part failed
    const user = await platformPrisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        firmId: true,
        name: true,
        role: true,
        status: true,
        passwordHash: true,
        firm: { select: { id: true, name: true, slug: true, status: true, onboardingState: true } },
      },
    });

    // 2. Guard: user not found OR account disabled
    if (!user || user.status !== "active") {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 3. Guard: no password set yet (account not fully provisioned)
    
    if (user.firm.status === "SUSPENDED") {
      return NextResponse.json({ error: "Workspace is suspended." }, { status: 403 });
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Account not yet activated. Contact your administrator." },
        { status: 401 }
      );
    }

    // 4. Verify password — bcrypt timing-safe compare
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 5. Create session — store ONLY userId, never password or role
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    session.userId = user.id;
    await session.save();

    // 6. Return safe user data (no passwordHash)
    return NextResponse.json({
      user: {
        id: user.id,
        firmId: user.firmId,
        name: user.name,
        role: user.role,
        firm: user.firm,
      },
    });
  } catch (err) {
    console.error("[auth/login] error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
