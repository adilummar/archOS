const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const res = await prisma.$queryRaw`
    SELECT rolname, rolsuper, rolbypassrls 
    FROM pg_roles 
    WHERE rolname IN ('elscore', 'archos_app_role')
  `;
  console.log(res);
}
check().catch(console.error).finally(() => prisma.$disconnect());
