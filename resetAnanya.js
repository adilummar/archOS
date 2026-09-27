const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const hash = await bcrypt.hash('ananya@coastaldesign.in', 10);
  await prisma.user.update({
    where: { email: 'ananya@coastaldesign.in' },
    data: { passwordHash: hash }
  });
  console.log("Password reset successfully");
}

main().catch(console.error).finally(() => prisma.$disconnect());
