const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    let firm = await prisma.firm.findFirst();
    if (!firm) firm = await prisma.firm.create({ data: { name: 'Test Firm', slug: 'tf', address: '123', phone: '123', email: 'tf@example.com' } });

    let user = await prisma.user.findFirst();
    if (!user) user = await prisma.user.create({ data: { firmId: firm.id, name: 'Test User', email: 'user@example.com', password: 'pw' } });

    let project = await prisma.project.findFirst();
    if (!project) project = await prisma.project.create({ data: { firmId: firm.id, name: 'Test Project' } });
}

run().catch(console.error).finally(() => prisma.$disconnect());
