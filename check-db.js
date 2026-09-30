const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const task = await prisma.task.findFirst({
    where: { assignee: { email: "vikki@coastaldesign.in" } }
  });
  console.log(task.title, task.status);
  
  const allStaffTasks = await prisma.task.findMany({
    where: { assignee: { role: "staff" } },
    select: { title: true, status: true, assigneeId: true }
  });
  console.log("All staff tasks:", allStaffTasks);
}
main();
