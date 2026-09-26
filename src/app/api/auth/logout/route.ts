import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    session.destroy();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/logout] error:", err);
    return NextResponse.json({ error: "Logout failed." }, { status: 500 });
  }
}
