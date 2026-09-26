const { PrismaClient } = require('@prisma/client');
// Temporarily connect as elscore to grant roles
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://elscore:secret@localhost:5432/archos_db?schema=public" } } });

async function fix() {
  await prisma.$executeRawUnsafe(`GRANT archos_app_role TO archos_app`);
  await prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO archos_app_role`);
  await prisma.$executeRawUnsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO archos_app_role`);
  await prisma.$executeRawUnsafe(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO archos_app_role`);
  
  await prisma.$executeRawUnsafe(`REVOKE ALL PRIVILEGES ON TABLE "PlatformAdmin" FROM archos_app_role`);
  console.log("Granted archos_app_role to archos_app");
}
fix().catch(console.error).finally(() => prisma.$disconnect());
