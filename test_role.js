const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://venueza:Venueza%40Prod2026@localhost:5432/venueza_prod?schema=archos' } } });

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM pg_roles WHERE rolname = 'archos_app_role'`;
    console.log(result);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
