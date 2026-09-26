const fs = require('fs');
let c = fs.readFileSync('src/app/api/v1/platform/firms/[firmId]/route.ts', 'utf8');

const patchTarget = `    const { planType } = await req.json();
    if (!planType) return NextResponse.json({ error: "Missing planType" }, { status: 400 });
    
    const firm = await PlatformService.updateFirmPlan((await params).firmId, planType);`;

const patchReplacement = `    const body = await req.json();
    if (Object.keys(body).length === 0) return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    
    const firm = await PlatformService.updateFirm((await params).firmId, body);`;

c = c.replace(patchTarget, patchReplacement);

const deleteRoute = `
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
`;

if (!c.includes("export async function DELETE")) {
  c += deleteRoute;
}

fs.writeFileSync('src/app/api/v1/platform/firms/[firmId]/route.ts', c);
console.log("Patched API Route");
