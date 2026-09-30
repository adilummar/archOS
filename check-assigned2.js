const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tasks = await prisma.task.findMany({
    where: { status: "assigned" },
    select: { id: true, title: true, status: true }
  });
  console.log("Tasks with assigned status:");
  console.log(JSON.stringify(tasks, null, 2));
}
main();
