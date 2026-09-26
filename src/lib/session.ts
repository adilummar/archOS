/**
 * iron-session configuration.
 * SESSION_SECRET must be at least 32 chars — set in .env, never committed.
 * The session cookie is httpOnly, signed, and encrypted server-side.
 * The browser can read its presence but NEVER its contents.
 */

import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  /** The authenticated user's database ID. This is the ONLY authoritative claim stored in the session. */
  userId: string;
}

export const sessionOptions: SessionOptions = {
  cookieName: "archos_session",
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && process.env.REQUIRE_HTTPS !== "false",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  },
};

/** Read the current session from the request cookie. Server-side only. */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export interface PlatformSessionData {
  platformAdminId: string;
}

export const platformSessionOptions: SessionOptions = {
  cookieName: "archos_platform_session",
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && process.env.REQUIRE_HTTPS !== "false",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  },
};

export async function getPlatformSession() {
  const cookieStore = await cookies();
  return getIronSession<PlatformSessionData>(cookieStore, platformSessionOptions);
}
