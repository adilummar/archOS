const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const platformPrisma = new PrismaClient({
  datasources: {
    db: { url: "postgresql://archos_platform:platform_secret@localhost:5432/archos_db?schema=public" }
  }
});

async function run() {
  const passwordHash = await bcrypt.hash("archos@2024", 10);
  await platformPrisma.user.updateMany({
    data: { passwordHash }
  });
  console.log("Passwords updated");
}
run();
