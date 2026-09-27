const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.firm.findMany({ select: { id: true, name: true, slug: true } })
  .then(r => { console.log(JSON.stringify(r, null, 2)); })
  .finally(() => prisma.$disconnect());
