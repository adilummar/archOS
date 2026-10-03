const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.$queryRaw`SELECT email, role, status FROM "User"`;
  console.log(users);
}
run();
