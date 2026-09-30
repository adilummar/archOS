const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tasks = await prisma.task.findMany({
    where: { title: "Site Analysis & Measurements" },
    select: { id: true, title: true, status: true, assignee: { select: { name: true, email: true } } }
  });
  console.log("Tasks:");
  console.log(JSON.stringify(tasks, null, 2));
}
main();
