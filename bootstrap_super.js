const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://archos_platform:platform_secret@localhost:5432/archos_db?schema=public" } }
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
  console.log("Bootstrap Super Admin ready:", admin.email);
}
bootstrap().catch(console.error).finally(() => prisma.$disconnect());
