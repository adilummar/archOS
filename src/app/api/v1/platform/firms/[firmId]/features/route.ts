import { NextRequest, NextResponse } from "next/server";
import { PlatformService, requirePlatformAuth } from "@/services/platform.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ firmId: string }> }) {
  try {
    await requirePlatformAuth();
    const firm = await PlatformService.getFirm((await params).firmId);
    if (!firm) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: firm.enabledFeatures });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ firmId: string }> }) {
  try {
    const admin = await requirePlatformAuth();
    const body = await req.json();
    if (!Array.isArray(body.enabledFeatures)) {
      return NextResponse.json({ error: "enabledFeatures must be an array of strings" }, { status: 400 });
    }
    
    // Explicitly validate keys to prevent arbitrary string injection
    const VALID_FEATURES = ["DASHBOARD", "PROJECTS", "TASKS", "STAFF", "ATTENDANCE", "CRM", "FINANCE", "DOCUMENTS", "RFI", "MEETINGS", "LEAVE", "TIME", "VARIATION_ORDERS"];
    const uniqueFeatures = Array.from(new Set(body.enabledFeatures)); // Remove duplicates
    for (const key of uniqueFeatures) {
      if (typeof key !== 'string' || !VALID_FEATURES.includes(key)) {
        return NextResponse.json({ error: `Invalid feature key: ${key}` }, { status: 400 });
      }
    }
    
    // Explicitly update only enabledFeatures
    const firm = await PlatformService.updateFirmFeatures((await params).firmId, uniqueFeatures as string[], admin.id);
    return NextResponse.json({ data: firm.enabledFeatures });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
