const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://venueza:Venueza%40Prod2026@localhost:5432/venueza_prod?schema=archos' } } });

async function main() {
  try {
    const res = await prisma.firm.update({
      where: { id: 'firm-coastal-001' },
      data: { name: 'Z Plus Studio', phone: '9562201788', address: 'kozhikkode' }
    });
    console.log("Success", res);
  } catch(e) {
    console.error("Error", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
