import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe('SET LOCAL ROLE archos_app_role');
  const firms = await prisma.$queryRaw`SELECT id FROM "Firm" LIMIT 1`;
  const firmId = firms[0].id;
  await prisma.$executeRawUnsafe(`SELECT set_config('app.current_firm_id', '${firmId}', true)`);
  
  const project = await prisma.project.findFirst({
    where: { name: 'shabeer residence' },
    select: { status: true }
  });
  console.log('Project status:', project);
}
main().catch(console.error);
