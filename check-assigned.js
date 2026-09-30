const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tasks = await prisma.task.findMany({
    where: { assignee: { name: "vikki" } },
    select: { id: true, title: true, status: true, dueDate: true }
  });
  console.log("Vikki's Tasks:");
  console.log(JSON.stringify(tasks, null, 2));
}
main();
