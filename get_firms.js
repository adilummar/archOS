const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const firms = await prisma.firm.findMany({
    include: { users: true }
  });
  firms.forEach(f => {
    console.log(`Firm: ${f.slug}`);
    f.users.forEach(u => console.log(`  - ${u.email} (${u.role})`));
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
