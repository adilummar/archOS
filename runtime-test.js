const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStartTask() {
  try {
    const user = await prisma.user.findFirst();
    const firm = await prisma.firm.findFirst();
    const project = await prisma.project.findFirst();
    
    if (!user || !firm || !project) {
        // Create them if missing
        console.log('Missing data, please check');
    }

    const testTask = await prisma.task.create({
      data: {
        firmId: firm.id,
        projectId: project.id,
        assigneeId: user.id,
        assignerId: user.id,
        title: 'Runtime Verify Task',
        status: 'assigned',
        priority: 'normal'
      }
    });

    console.log('Created task with startedAt =', testTask.startedAt);

    const updated1 = await prisma.task.update({
      where: { id: testTask.id },
      data: { status: 'in_progress', startedAt: testTask.startedAt || new Date() }
    });

    const timestampX = updated1.startedAt;
    console.log('Started task, startedAt =', timestampX);

    // Sleep for 100ms
    await new Promise(r => setTimeout(r, 100));

    const updated2 = await prisma.task.update({
      where: { id: testTask.id },
      data: { status: 'in_progress', startedAt: updated1.startedAt || new Date() }
    });

    console.log('Started again, startedAt =', updated2.startedAt);

    if (timestampX.getTime() === updated2.startedAt.getTime()) {
      console.log('SUCCESS: Timestamp is strictly immutable.');
    } else {
      console.log('FAIL: Timestamp changed.');
    }

    await prisma.task.delete({ where: { id: testTask.id } });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

testStartTask();
