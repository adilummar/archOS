const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PLATFORM_DATABASE_URL
    }
  }
});

async function main() {
  const firms = await prisma.firm.findMany({
    include: { users: true }
  });
  console.log(JSON.stringify(firms.map(f => ({ slug: f.slug, users: f.users.map(u => ({ email: u.email, role: u.role })) })), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
