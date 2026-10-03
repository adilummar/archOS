import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { platformPrisma } from "@/lib/platform-db";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

    if (!session.userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Resolve full user + firm from DB — never trust client-supplied values
    const user = await platformPrisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        firmId: true,
        name: true,
        email: true,
        role: true,
        status: true,
        designation: true,
        avatarInitials: true,
        avatarColor: true,
        costRatePerHour: true,
        joinedAt: true,
        // passwordHash intentionally omitted
        firm: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            phone: true,
            address: true,
            gstin: true,
            website: true,
            logo: true,
            planType: true,
            onboardingState: true,
            enabledFeatures: true,
            createdAt: true,
            minimumTaskLeadTimeDays: true,
            priorityPeriodDays: true,
          },
        },
      },
    });

    if (!user || user.status !== "active") {
      // User deactivated since session was created — invalidate
      const freshSession = await getIronSession<SessionData>(cookieStore, sessionOptions);
      freshSession.destroy();
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("[auth/me] error:", err);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
