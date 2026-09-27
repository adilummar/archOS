const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://venueza:Venueza%40Prod2026@localhost:5432/venueza_prod?schema=archos' } } });

async function main() {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_user_id', 'user-adil-001', true)`;
      await tx.$executeRaw`SELECT set_config('app.current_firm_id', 'firm-coastal-001', true)`;
      const res = await tx.firm.update({
        where: { id: 'firm-coastal-001' },
        data: { onboardingState: 'COMPLETED' }
      });
      console.log('Success:', res.onboardingState);
    });
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
