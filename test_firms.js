const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://venueza:Venueza%40Prod2026@localhost:5432/venueza_prod?schema=archos' } } });

async function main() {
  try {
    const firms = await prisma.firm.findMany({ select: { id: true, name: true, slug: true, onboardingState: true } });
    console.log(firms);
  } finally {
    await prisma.$disconnect();
  }
}
main();
