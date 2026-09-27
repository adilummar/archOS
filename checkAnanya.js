const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'ananya@coastaldesign.in' },
    include: { firm: true }
  });
  
  if (!user) {
    console.log("User not found");
    return;
  }

  console.log("User:", user.email);
  console.log("Firm:", user.firm.slug);
  console.log("Status:", user.status);
  console.log("Password Hash:", user.passwordHash);

  // Test the password
  const isMatch = await bcrypt.compare('ananya@coastaldesign.in', user.passwordHash);
  console.log("Does 'ananya@coastaldesign.in' match hash?", isMatch);
}

main().catch(console.error).finally(() => prisma.$disconnect());
