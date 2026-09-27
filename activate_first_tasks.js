const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const firm = await prisma.firm.findUnique({ where: { slug: 'cda' } });
  console.log('Firm:', firm.name, firm.id);

  // Get all projects for this firm
  const projects = await prisma.project.findMany({
    where: { firmId: firm.id },
    include: {
      stages: {
        orderBy: { order: 'asc' },
        include: {
          tasks: { orderBy: { order: 'asc' } }
        }
      }
    }
  });

  for (const project of projects) {
    console.log(`\nProject: ${project.name}`);

    // Check if any task is already active or further along
    const allTasks = project.stages.flatMap(s => s.tasks);
    const hasActiveTasks = allTasks.some(t => ['active', 'assigned', 'in_progress', 'submitted_for_review', 'completed'].includes(t.status));

    if (hasActiveTasks) {
      console.log('  → Already has active/in-progress tasks, skipping');
      continue;
    }

    // All future — find the very first task (stage order 1, task order 1)
    const firstStage = project.stages[0];
    if (!firstStage) { console.log('  → No stages found'); continue; }

    const firstTask = firstStage.tasks[0];
    if (!firstTask) { console.log('  → No tasks in first stage'); continue; }

    console.log(`  → Activating first task: "${firstTask.title}" (id: ${firstTask.id})`);
    await prisma.task.update({
      where: { id: firstTask.id },
      data: { status: 'active' }
    });

    // Also set first stage to in_progress
    await prisma.projectStage.update({
      where: { id: firstStage.id },
      data: { status: 'in_progress' }
    });

    console.log(`  ✅ Done — "${firstTask.title}" is now Active`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
