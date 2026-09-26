const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rs = await prisma.$queryRawUnsafe("SELECT current_user, usesuper, usecreatedb, userepl, usebypassrls FROM pg_user WHERE usename = current_user");
  console.log(rs);
}
main().finally(() => prisma.$disconnect());
