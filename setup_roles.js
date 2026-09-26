const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupRoles() {
  try {
    await prisma.$executeRawUnsafe(`CREATE ROLE archos_app WITH LOGIN PASSWORD 'app_secret' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`);
  } catch(e) {
    await prisma.$executeRawUnsafe(`ALTER ROLE archos_app WITH LOGIN PASSWORD 'app_secret' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`);
  }
  
  try {
    await prisma.$executeRawUnsafe(`CREATE ROLE archos_platform WITH LOGIN PASSWORD 'platform_secret' NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS`);
  } catch(e) {
    await prisma.$executeRawUnsafe(`ALTER ROLE archos_platform WITH LOGIN PASSWORD 'platform_secret' NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS`);
  }

  await prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO archos_app`);
  await prisma.$executeRawUnsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO archos_app`);
  await prisma.$executeRawUnsafe(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO archos_app`);
  
  await prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO archos_platform`);
  await prisma.$executeRawUnsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO archos_platform`);
  await prisma.$executeRawUnsafe(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO archos_platform`);

  const tables = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  for (const row of tables) {
    const table = row.tablename;
    if (table !== '_prisma_migrations' && table !== 'PlatformAdmin') {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
    }
  }

  // Ensure archos_app cannot touch PlatformAdmin
  await prisma.$executeRawUnsafe(`REVOKE ALL PRIVILEGES ON TABLE "PlatformAdmin" FROM archos_app`);
  
  // RLS for PlatformAdmin (optional, but good practice). Since it's not enabled, archos_app is blocked by REVOKE anyway, but let's enable RLS and just not give archos_app any policies.
  await prisma.$executeRawUnsafe(`ALTER TABLE "PlatformAdmin" ENABLE ROW LEVEL SECURITY`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PlatformAdmin" FORCE ROW LEVEL SECURITY`);
  // platform user bypasses RLS so it can read it.

  console.log("Roles and RLS configured!");
}
setupRoles().catch(console.error).finally(() => prisma.$disconnect());
