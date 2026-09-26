const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://archos_platform:platform_secret@localhost:5432/archos_db?schema=public" } } });
prisma.firm.findMany().then(r => console.log("Firms count:", r.length)).finally(() => prisma.$disconnect());
