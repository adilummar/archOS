import { NextResponse } from "next/server";
import { getPlatformSession } from "@/lib/session";

export async function POST() {
  const session = await getPlatformSession();
  session.destroy();
  return NextResponse.json({ success: true });
}
