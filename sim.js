const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://archos_platform:platform_secret@localhost:5432/archos_db?schema=public' } } });

async function run() {
  const firm = await prisma.firm.create({ data: { name: 'Bug Test Firm', slug: 'bug-test-' + Date.now(), status: 'active', planType: 'premium', address: 'N/A' } });
  const admin = await prisma.user.create({ data: { firmId: firm.id, name: 'Admin', email: 'admin' + Date.now() + '@bug.com', role: 'admin', status: 'active', passwordHash: 'x' } });

  console.log('Created firm and admin.');
  
  for (let i = 1; i <= 3; i++) {
    await prisma.user.create({
      data: {
        firmId: firm.id,
        name: 'User ' + i,
        email: 'user' + i + '_' + Date.now() + '@bug.com',
        role: i === 1 ? 'staff' : i === 2 ? 'team_lead' : 'accounts',
        status: 'active',
        passwordHash: 'x'
      }
    });
    console.log('Created User ' + i);
  }

  const staff = await prisma.user.findMany({ where: { firmId: firm.id, status: 'active' } });
  console.log('Total users found: ' + staff.length);
  
  await prisma.user.deleteMany({ where: { firmId: firm.id } });
  await prisma.firm.delete({ where: { id: firm.id } });
}
run();
