const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://venueza:Venueza%40Prod2026@localhost:5432/venueza_prod?schema=archos' } } });

async function main() {
  try {
    const passwordHash = await bcrypt.hash('archos2026', 10);
    const firmId = 'firm-demo-001';
    
    // Upsert firm
    await prisma.firm.upsert({
      where: { slug: 'demo' },
      update: {
        onboardingState: 'COMPLETED',
        status: 'ACTIVE'
      },
      create: {
        id: firmId,
        name: 'Demo Architecture',
        slug: 'demo',
        status: 'ACTIVE',
        onboardingState: 'COMPLETED',
        planType: 'professional',
        address: '123 Test St',
        phone: '1234567890',
        email: 'info@archstudio.com',
        enabledFeatures: ['DASHBOARD', 'PROJECTS', 'TASKS', 'STAFF', 'ATTENDANCE']
      }
    });

    const firm = await prisma.firm.findUnique({ where: { slug: 'demo' } });

    // Upsert user
    await prisma.user.upsert({
      where: { email: 'demo@archos.com' },
      update: {
        passwordHash: passwordHash,
        status: 'active',
        role: 'admin'
      },
      create: {
        id: 'user-demo-001',
        firmId: firm.id,
        email: 'demo@archos.com',
        name: 'Demo Admin',
        role: 'admin',
        status: 'active',
        passwordHash: passwordHash
      }
    });

    console.log("SUCCESS. Email: demo@archos.com, Password: archos2026, Workspace: demo");
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
