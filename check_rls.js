const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const res = await prisma.$queryRaw`SELECT tablename, policyname, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public'`;
  console.log(res);
}
check().catch(console.error).finally(() => prisma.$disconnect());
