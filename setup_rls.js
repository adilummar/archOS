const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://venueza:Venueza%40Prod2026@localhost:5432/venueza_prod?schema=archos' } } });

async function main() {
  try {
    console.log("Creating role...");
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'archos_app_role') THEN
          CREATE ROLE archos_app_role;
        END IF;
      END
      $$;
    `);
    
    console.log("Granting usage on schema...");
    await prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA archos TO archos_app_role;`);
    
    console.log("Granting privileges on all tables...");
    await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA archos TO archos_app_role;`);
    
    console.log("Granting role to venueza...");
    await prisma.$executeRawUnsafe(`GRANT archos_app_role TO venueza;`);
    
    console.log("Success!");
  } catch (err) {
    console.error("Failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
