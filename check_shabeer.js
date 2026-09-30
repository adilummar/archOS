const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET LOCAL ROLE archos_app_role');
    const firms = await tx.$queryRaw`SELECT id FROM "Firm" LIMIT 1`;
    const firmId = firms[0].id;
    await tx.$executeRawUnsafe(`SELECT set_config('app.current_firm_id', '${firmId}', true)`);
    await tx.$executeRawUnsafe(`SELECT set_config('app.current_user_id', 'some-uuid', true)`);
    
    return await tx.project.findFirst({
      where: { name: 'shabeer residence' },
      select: { status: true, teamLeadId: true }
    });
  });
  console.log(result);
}
main().catch(console.error);
