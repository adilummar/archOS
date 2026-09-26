const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const admin = await prisma.platformAdmin.findUnique({
    where: { email: 'super@archos.com' }
  });
  console.log("Admin record:", admin);
}
main().catch(console.error).finally(() => prisma.$disconnect());
