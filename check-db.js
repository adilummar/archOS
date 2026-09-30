const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const allStaffTasks = await prisma.task.findMany({
    where: { status: { in: ['ASSIGNED', 'assigned'] } },
    select: { title: true, status: true, assigneeId: true }
  });
  console.log("Assigned tasks:", allStaffTasks);
}
main();
