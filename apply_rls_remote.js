const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.PLATFORM_DATABASE_URL } } });

async function main() {
  try {
    let sql = fs.readFileSync('prisma/rls.sql', 'utf8');
    
    // Replace "public" with "archos" in the GRANT statements
    sql = sql.replace(/SCHEMA public/g, 'SCHEMA archos');
    
    // Split by semicolons and execute
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    
    console.log(`Executing ${statements.length} RLS statements...`);
    for (let s of statements) {
      if (!s.trim()) continue;
      await prisma.$executeRawUnsafe(s + ';');
    }
    console.log("? Successfully applied Row-Level Security policies to the database!");
  } catch(err) {
    console.error("Error applying RLS:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
