const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const allTasks = await prisma.task.findMany({
    select: { title: true, status: true, assigneeId: true }
  });
  console.log("Tasks:");
  const statuses = new Set();
  allTasks.forEach(t => {
      if (t.assigneeId) {
          statuses.add(t.status);
          console.log(`- ${t.title} [${t.status}] (Assigned to ${t.assigneeId})`);
      }
  });
  console.log("Distinct statuses of assigned tasks:", Array.from(statuses));
}
main();
