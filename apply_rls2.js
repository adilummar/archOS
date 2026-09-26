const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sql = fs.readFileSync('prisma/rls.sql', 'utf8');
  const statements = sql
    .replace(/DO \$\$[\s\S]*?\$\$;/g, '') // Remove DO block, we do it below
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  try {
    await prisma.$executeRawUnsafe("CREATE ROLE archos_app_role NOLOGIN");
  } catch(e) { /* ignore exists */ }
  
  for (const s of statements) {
    try {
      await prisma.$executeRawUnsafe(s);
    } catch(e) {
      console.error('Failed statement:', s);
      console.error(e.message);
      process.exit(1);
    }
  }
  console.log('Successfully enabled RLS on all tables!');
}

main().finally(() => prisma.$disconnect());
