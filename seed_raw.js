const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const platformPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://archos_platform:platform_secret@localhost:5432/archos_db?schema=public",
    },
  },
});

async function run() {
  const passwordHash = await bcrypt.hash("archos@2024", 10);
  const firmId = 'firm-cda-001';
  
  try {
    const firm = await platformPrisma.firm.upsert({
      where: { id: firmId },
      update: {},
      create: {
        id: firmId,
        slug: 'cda',
        name: 'Coastal Design',
        planType: 'professional',
        onboardingState: 'NOT_STARTED',
        enabledFeatures: ['TASKS', 'PROJECTS', 'STAFF_MANAGEMENT', 'ATTENDANCE'],
        address: "123 Main",
        phone: "555-5555",
        email: "hello@cda.com"
      }
    });
      
    await platformPrisma.user.upsert({
      where: { email: 'adil@coastaldesign.in' },
      update: { passwordHash },
      create: { id: 'user-adil-001', firmId, email: 'adil@coastaldesign.in', name: 'Adil', role: 'admin', passwordHash, status: 'active' }
    });
      
    await platformPrisma.user.upsert({
      where: { email: 'rahul@coastaldesign.in' },
      update: { passwordHash },
      create: { id: 'user-rahul-001', firmId, email: 'rahul@coastaldesign.in', name: 'Rahul', role: 'staff', passwordHash, status: 'active' }
    });

    await platformPrisma.user.upsert({
      where: { email: 'priya@coastaldesign.in' },
      update: { passwordHash },
      create: { id: 'user-priya-001', firmId, email: 'priya@coastaldesign.in', name: 'Priya', role: 'team_lead', passwordHash, status: 'active' }
    });

    console.log("Seeded via platformPrisma instance");
  } catch (e) {
      console.log(e);
  }
}

run();
