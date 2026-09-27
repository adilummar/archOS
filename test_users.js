const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://venueza:Venueza%40Prod2026@localhost:5432/venueza_prod?schema=archos' } } });

async function main() {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, firmId: true, role: true } });
    console.log(users);
  } finally {
    await prisma.$disconnect();
  }
}
main();
