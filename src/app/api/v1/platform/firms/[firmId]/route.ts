import { NextRequest, NextResponse } from "next/server";
import { PlatformService, requirePlatformAuth } from "@/services/platform.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ firmId: string }> }) {
  try {
    await requirePlatformAuth();
    const firm = await PlatformService.getFirm((await params).firmId);
    if (!firm) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: firm });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ firmId: string }> }) {
  try {
    await requirePlatformAuth();
    const body = await req.json();
    if (Object.keys(body).length === 0) return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    
    const firm = await PlatformService.updateFirm((await params).firmId, body);
    return NextResponse.json({ data: firm });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ firmId: string }> }) {
  try {
    await requirePlatformAuth();
    await PlatformService.deleteFirm((await params).firmId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    console.error("DELETE Firm error:", err);
    return NextResponse.json({ error: "Failed to delete firm. Ensure cascading deletes are configured." }, { status: 500 });
  }
}
