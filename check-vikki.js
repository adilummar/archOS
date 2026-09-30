const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tasks = await prisma.task.findMany({
    where: { title: "Site Analysis & Measurements" },
    select: { id: true, title: true, status: true, assignee: { select: { firstName: true, lastName: true } } }
  });
  console.log("Tasks:");
  console.log(tasks);
}
main();
