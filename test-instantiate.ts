import { PrismaClient } from '@prisma/client';
import { instantiateProjectFromTemplate } from './src/services/project.service';
import { AuthContext } from './src/lib/auth/context';

const prisma = new PrismaClient();

async function test() {
  try {
    const firm = await prisma.firm.findFirst();
    const template = await prisma.projectTemplate.findFirst({
      where: { name: "Residential Architecture — Full Project Workflow", firmId: firm.id }
    });

    const adminUser = await prisma.user.findFirst({
      where: { firmId: firm.id, role: "admin" }
    });

    const ctx = {
      userId: adminUser.id,
      firmId: firm.id,
      role: "admin",
      db: prisma
    };

    const project = await instantiateProjectFromTemplate(ctx, {
      firmId: firm.id,
      templateId: template.id,
      name: "DUMMY TEST PROJECT " + Date.now(),
      clientId: null,
      teamLeadId: null,
      staffIds: [],
    });

    console.log("Project created:", project.id);

    // Fetch tasks
    const tasks = await prisma.task.findMany({
      where: { projectId: project.id },
      orderBy: { order: 'asc' },
      include: { stage: true }
    });

    console.log("Tasks:");
    tasks.forEach(t => {
      console.log(`Stage: ${t.stage.name} - Task: ${t.title} - Status: ${t.status} - Due Date: ${t.dueDate} - Assignee: ${t.assigneeId}`);
    });

    // Clean up
    await prisma.project.delete({ where: { id: project.id } });
    console.log("Cleaned up dummy project.");

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
