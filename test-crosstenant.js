const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const firms = await prisma.firm.findMany({ take: 2 });
  const firmA = firms[0];
  const firmB = firms[1];
  const adminA = await prisma.user.findFirst({ where: { firmId: firmA.id, role: 'admin' } });

  console.log(`Before: Firm A name = ${firmA.name}, Firm B name = ${firmB.name}`);

  // Simulate payload injection where Firm A admin tries to patch Firm B
  const payload = {
    firmId: firmB.id,
    name: "HACKED NAME"
  };

  // The actual backend logic drops data.firmId and uses ctx.firmId
  // which is derived safely from auth session (adminA.firmId)
  
  // Simulated backend execution of src/app/api/v1/onboarding/company/route.ts
  const ctxFirmId = adminA.firmId; 
  
  await prisma.$transaction(async (tx) => {
    // This simulates withAuthTx using ctx.firmId
    await tx.$executeRawUnsafe(`SELECT set_config('app.current_firm_id', '${ctxFirmId}', true)`);
    await tx.firm.update({
      where: { id: ctxFirmId },
      data: {
        name: payload.name
      }
    });
  });

  const firmA_after = await prisma.firm.findUnique({ where: { id: firmA.id } });
  const firmB_after = await prisma.firm.findUnique({ where: { id: firmB.id } });

  console.log(`After: Firm A name = ${firmA_after.name}, Firm B name = ${firmB_after.name}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
