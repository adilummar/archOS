import { NextRequest, NextResponse } from "next/server";
import { PlatformService, requirePlatformAuth } from "@/services/platform.service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ firmId: string }> }) {
  try {
    await requirePlatformAuth();
    const { status } = await req.json();
    
    if (status !== "ACTIVE" && status !== "SUSPENDED") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const firm = await PlatformService.setFirmStatus((await params).firmId, status);
    return NextResponse.json({ success: true, data: firm });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
