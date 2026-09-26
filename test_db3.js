const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe("CREATE ROLE archos_app_role NOLOGIN;");
    await prisma.$executeRawUnsafe("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO archos_app_role;");
    await prisma.$executeRawUnsafe("GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO archos_app_role;");
  } catch(e) {}
  
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET LOCAL ROLE archos_app_role;");
    const count = await tx.task.count();
    console.log('Task count inside tx with archos_app_role:', count);
  });
}
main().finally(() => prisma.$disconnect());
