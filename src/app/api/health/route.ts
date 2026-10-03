import { NextResponse } from "next/server";

export async function GET() {
  // Liveness probe (minimal response)
  // Note: Readiness (DB check) could be implemented separately if required
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
