const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const firm = await prisma.firm.findUnique({ where: { slug: 'cda' } });
  console.log('Firm:', firm.name);

  const templates = await prisma.projectTemplate.findMany({ 
    where: { firmId: firm.id },
    include: { 
      stages: { 
        include: { tasks: true },
        orderBy: { order: 'asc' }
      } 
    } 
  });

  for (const t of templates) {
    console.log(`\nTemplate: ${t.name} (${t.id})`);
    for (const s of t.stages) {
      console.log(`  Stage ${s.order}: ${s.name} — ${s.tasks.length} tasks`);
      for (const task of s.tasks) {
        console.log(`    Task ${task.order}: ${task.title}`);
      }
    }
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
