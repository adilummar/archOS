const fs = require('fs');
let c = fs.readFileSync('src/app/api/v1/platform/firms/[firmId]/route.ts', 'utf8');

const patchFn = `
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ firmId: string }> }) {
  try {
    await requirePlatformAuth();
    const { planType } = await req.json();
    if (!planType) return NextResponse.json({ error: "Missing planType" }, { status: 400 });
    
    const firm = await PlatformService.updateFirmPlan((await params).firmId, planType);
    return NextResponse.json({ data: firm });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
`;

c += patchFn;
fs.writeFileSync('src/app/api/v1/platform/firms/[firmId]/route.ts', c);
console.log("Patched Firm Detail Route");
