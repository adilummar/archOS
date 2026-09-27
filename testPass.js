const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'ananya@coastaldesign.in' },
  });
  
  console.log("Match '':", await bcrypt.compare('', user.passwordHash));
  console.log("Match 'password':", await bcrypt.compare('password', user.passwordHash));
  console.log("Match 'undefined':", await bcrypt.compare('undefined', user.passwordHash));
}

main().catch(console.error).finally(() => prisma.$disconnect());
