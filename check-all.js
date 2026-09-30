const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tasks = await prisma.task.findMany({
    select: { id: true, title: true, status: true, dueDate: true, assignee: { select: { name: true } } }
  });
  console.log("All tasks statuses:");
  const statuses = [...new Set(tasks.map(t => t.status))];
  console.log(statuses);
  
  const assigned = tasks.filter(t => t.status.toLowerCase().includes('assign') || t.status === 'ASSIGNED');
  console.log("Tasks with 'assign' in status:", JSON.stringify(assigned, null, 2));
}
main();
