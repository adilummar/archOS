const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const staff = await prisma.user.findFirst({ where: { email: "vikki@coastaldesign.in" } });
  if (!staff) { console.log("vikki not found"); return; }
  
  const tasks = await prisma.task.findMany({
    where: { assigneeId: staff.id },
    select: { id: true, title: true, status: true }
  });
  console.log("Vikki's tasks:");
  console.log(tasks);
}
main();
