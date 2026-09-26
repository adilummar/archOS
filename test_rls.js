const { prisma } = require('./src/lib/db.ts');
async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'adil@coastaldesign.in' }
  });
  console.log(user);
}
main().catch(console.error).finally(() => prisma.$disconnect());
