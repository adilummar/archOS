const { PrismaClient } = require('@prisma/client');

async function runTests() {
  console.log("=== RUNNING SECURITY TESTS ===");
  
  const appPrisma = new PrismaClient({
    datasources: { db: { url: "postgresql://archos_app:app_secret@localhost:5432/archos_db?schema=public" } }
  });
  
  const platformPrisma = new PrismaClient({
    datasources: { db: { url: "postgresql://archos_platform:platform_secret@localhost:5432/archos_db?schema=public" } }
  });

  try {
    // Ensure 2 firms exist
    let firms = await platformPrisma.firm.findMany();
    if (firms.length === 1) {
      await platformPrisma.firm.create({
        data: {
          name: 'Test Firm B',
          slug: 'firm-b',
          address: '123 Test',
          phone: '1234567890',
          email: 'testb@example.com'
        }
      });
      firms = await platformPrisma.firm.findMany();
    }
    const firmA = firms[0].id;
    const firmB = firms[1].id;

    const currentUserRes = await appPrisma.$queryRawUnsafe(`SELECT current_user`);
    console.log("App current_user:", currentUserRes[0].current_user);

    const allFirmsWithoutContext = await appPrisma.firm.findMany();
    console.log("Test B/C - Firms visible without context (expected 0):", allFirmsWithoutContext.length);
    if (allFirmsWithoutContext.length !== 0) throw new Error("FAIL: RLS bypass detected without context!");

    let firmA_visible = 0;
    await appPrisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET LOCAL ROLE archos_app_role');
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_user_id', 'dummy', true)`);
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_firm_id', '${firmA}', true)`);
      const visibleFirms = await tx.firm.findMany();
      firmA_visible = visibleFirms.length;
      
      const checkFirmB = visibleFirms.find(f => f.id === firmB);
      if (checkFirmB) throw new Error("FAIL: Firm A saw Firm B!");
      
      const updateResult = await tx.firm.updateMany({
        where: { id: firmB },
        data: { name: "Hacked" }
      });
      if (updateResult.count !== 0) throw new Error("FAIL: Firm A updated Firm B!");
    });
    console.log("Test A - Firms visible to Firm A (expected 1):", firmA_visible);

    const platformFirms = await platformPrisma.firm.findMany();
    console.log("Test E - Firms visible to Platform (expected >= 2):", platformFirms.length);
    if (platformFirms.length < 2) throw new Error("FAIL: Platform could not see all firms");

    let tenantSawAdmins = false;
    try {
      await appPrisma.platformAdmin.findMany();
      tenantSawAdmins = true;
    } catch (e) {
      // expected permission denied
    }
    console.log("Test G - Tenant accessing PlatformAdmin (expected false):", tenantSawAdmins);
    if (tenantSawAdmins) throw new Error("FAIL: Tenant accessed PlatformAdmin!");

    console.log("=== ALL TESTS PASSED ===");
  } catch (e) {
    console.error(e);
  } finally {
    await appPrisma.$disconnect();
    await platformPrisma.$disconnect();
  }
}
runTests();
