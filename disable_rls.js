const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "Firm" DISABLE ROW LEVEL SECURITY;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;`);
  console.log("RLS disabled");
}
run();
