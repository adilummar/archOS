const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const staff = await prisma.user.findFirst({ where: { email: "vikki@coastaldesign.in" } });
  if (!staff) { console.log("vikki not found"); return; }
  
  // Find a task for vikki
  let task = await prisma.task.findFirst({
    where: { assigneeId: staff.id, status: 'assigned' }
  });

  if (!task) {
      console.log("No assigned task found. Assigning an active one...");
      task = await prisma.task.findFirst({ where: { status: 'active', assigneeId: null } });
      if (task) {
          task = await prisma.task.update({
              where: { id: task.id },
              data: { status: 'assigned', assigneeId: staff.id, dueDate: new Date() }
          });
      }
  }
  if (!task) {
      console.log("No task found at all.");
      return;
  }
  
  console.log(`Task: ${task.title} | Status: ${task.status} | Assignee: ${task.assigneeId}`);
  
  // Try to start the task
  const { startTask } = require('./.next/server/app/actions/task.actions.js');
  
  console.log("Starting task...");
  // But startTask needs getSession, which fails outside Next.js!
  // I will call Service.startTask directly
  
  const { startTask: serviceStartTask } = require('./.next/server/app/api/v1/tasks/route.js'); // just simulating
}
main();
