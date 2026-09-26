const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Pick up URL from environment, fallback to localhost for dev
const dbUrl = process.env.PLATFORM_DATABASE_URL || "postgresql://archos_platform:platform_secret@localhost:5432/archos_db?schema=public";

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } }
});

async function bootstrap() {
  const hash = await bcrypt.hash('supersecret123', 10);
  const admin = await prisma.platformAdmin.upsert({
    where: { email: 'super@archos.com' },
    update: { passwordHash: hash },
    create: {
      email: 'super@archos.com',
      name: 'Initial Super Admin',
      passwordHash: hash,
      active: true
    }
  });
  console.log("✅ Bootstrap Super Admin ready:");
  console.log("Email: ", admin.email);
  console.log("Password: supersecret123");
  console.log("Please log in to the Super Admin portal and change this password immediately via Settings.");
}
bootstrap().catch(console.error).finally(() => prisma.$disconnect());
