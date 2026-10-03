const { PrismaClient } = require('@prisma/client');
const platformPrisma = new PrismaClient({ datasources: { db: { url: "postgresql://archos_platform:platform_secret@localhost:5432/archos_db?schema=public" } } });
async function run() {
  const firm = await platformPrisma.firm.findUnique({ where: { id: 'firm-coastal-001' } });
  console.log(firm.enabledFeatures);
}
run();
