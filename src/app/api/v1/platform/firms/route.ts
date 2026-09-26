import { NextRequest, NextResponse } from "next/server";
import { PlatformService, requirePlatformAuth } from "@/services/platform.service";

export async function GET(req: NextRequest) {
  try {
    await requirePlatformAuth();
    const firms = await PlatformService.listFirms();
    return NextResponse.json({ data: firms });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePlatformAuth();
    const body = await req.json();
    
    if (!body.name || !body.adminEmail || !body.adminName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const firm = await PlatformService.createFirmWithAdmin(
      { name: body.name, address: body.address, phone: body.phone, email: body.email },
      body.adminEmail,
      body.adminName
    );

    return NextResponse.json({ success: true, data: firm });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (err.message === "DUPLICATE_ADMIN_EMAIL") return NextResponse.json({ error: "Admin email already in use" }, { status: 409 });
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
