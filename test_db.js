const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
async function main() {
  const admins = await prisma.platformAdmin.findMany();
  console.log("Admins in DB:", admins);
}
main().catch(console.error).finally(() => prisma.$disconnect());
