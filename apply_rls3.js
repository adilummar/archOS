const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe("CREATE ROLE archos_app_role NOLOGIN");
  } catch(e) { }
  
  const sql = fs.readFileSync('prisma/rls.sql', 'utf8');
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  
  for (const s of statements) {
    try {
      await prisma.$executeRawUnsafe(s);
    } catch(e) {
      console.error('Failed:', s);
      console.error(e.message);
      process.exit(1);
    }
  }
  console.log('Successfully enabled RLS!');
}

main().finally(() => prisma.$disconnect());
