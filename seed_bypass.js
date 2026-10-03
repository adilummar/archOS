const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function run() {
  const passwordHash = await bcrypt.hash("archos@2024", 10);
  const firmId = 'firm-cda-001';
  
  await prisma.$executeRawUnsafe(`SET app.current_tenant_id = '${firmId}';`);
  
  try {
    await prisma.$executeRaw`INSERT INTO "Firm" (id, slug, name, "planType", "onboardingState", "priorityPeriodDays", "enabledFeatures") 
      VALUES (${firmId}, 'cda', 'Coastal Design', 'professional', 'NOT_STARTED', 3, ARRAY['TASKS', 'PROJECTS', 'STAFF_MANAGEMENT'])
      ON CONFLICT DO NOTHING;`;
      
    await prisma.$executeRaw`INSERT INTO "User" (id, "firmId", email, name, role, "passwordHash", status, "updatedAt")
      VALUES ('user-adil-001', ${firmId}, 'adil@coastaldesign.in', 'Adil', 'admin', ${passwordHash}, 'active', NOW())
      ON CONFLICT DO NOTHING;`;
      
    await prisma.$executeRaw`INSERT INTO "User" (id, "firmId", email, name, role, "passwordHash", status, "updatedAt")
      VALUES ('user-rahul-001', ${firmId}, 'rahul@coastaldesign.in', 'Rahul', 'staff', ${passwordHash}, 'active', NOW())
      ON CONFLICT DO NOTHING;`;

    await prisma.$executeRaw`INSERT INTO "User" (id, "firmId", email, name, role, "passwordHash", status, "updatedAt")
      VALUES ('user-priya-001', ${firmId}, 'priya@coastaldesign.in', 'Priya', 'team_lead', ${passwordHash}, 'active', NOW())
      ON CONFLICT DO NOTHING;`;

    console.log("Seeded");
  } catch (e) {
      console.log(e);
  }
}

run();
