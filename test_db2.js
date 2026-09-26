const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe("ALTER TABLE \"Task\" ENABLE ROW LEVEL SECURITY;");
  await prisma.$executeRawUnsafe("ALTER TABLE \"Task\" FORCE ROW LEVEL SECURITY;");
  await prisma.$executeRawUnsafe("DROP POLICY IF EXISTS \"deny_all\" ON \"Task\";");
  await prisma.$executeRawUnsafe("CREATE POLICY \"deny_all\" ON \"Task\" FOR ALL USING (false);");
  
  const count = await prisma.task.count();
  console.log('Task count with deny_all policy for superuser:', count);
}
main().finally(() => prisma.$disconnect());
