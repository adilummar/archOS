const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const res = await prisma.$queryRaw`
    SELECT relname, relrowsecurity, relforcerowsecurity 
    FROM pg_class 
    WHERE relnamespace = 'public'::regnamespace 
      AND relkind = 'r'
  `;
  console.log(res);
}
check().catch(console.error).finally(() => prisma.$disconnect());
