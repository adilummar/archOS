const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seed() {
  const firm = await prisma.firm.findUnique({ where: { slug: "cda" } });
  const admin = await prisma.user.findUnique({ where: { email: "adil@coastaldesign.in" } });
  const staff = await prisma.user.findUnique({ where: { email: "rahul@coastaldesign.in" } });

  if (!firm || !admin || !staff) {
    console.log("Firm or users missing. Run main seed first.");
    return;
  }

  // Create a Client
  const client = await prisma.client.create({
    data: {
      firmId: firm.id,
      name: "John Doe",
      email: "john@example.com",
      phone: "+91 9000000000",
    }
  });

  // Create Project
  const project = await prisma.project.create({
    data: {
      firmId: firm.id,
      clientId: client.id,
      teamLeadId: admin.id,
      name: "John Doe Villa",
      location: "Kochi, Kerala",
      startDate: new Date(),
      status: "active",
      staffMembers: {
        create: [
          { userId: admin.id },
          { userId: staff.id }
        ]
      }
    }
  });

  // Create Stages
  const stage1 = await prisma.projectStage.create({
    data: {
      projectId: project.id,
      name: "Schematic Design",
      order: 1,
      status: "in_progress",
    }
  });

  const stage2 = await prisma.projectStage.create({
    data: {
      projectId: project.id,
      name: "Design Development",
      order: 2,
      status: "pending",
    }
  });

  // Create Tasks
  await prisma.task.createMany({
    data: [
      {
        firmId: firm.id,
        projectId: project.id,
        stageId: stage1.id,
        title: "Initial Client Meeting",
        description: "Gather requirements and site details",
        assigneeId: admin.id,
        assignerId: admin.id,
        status: "completed",
        priority: "high"
      },
      {
        firmId: firm.id,
        projectId: project.id,
        stageId: stage1.id,
        title: "Draft Floor Plans",
        description: "Create initial layout options",
        assigneeId: staff.id,
        assignerId: admin.id,
        status: "in_progress",
        priority: "high"
      },
      {
        firmId: firm.id,
        projectId: project.id,
        stageId: stage1.id,
        title: "3D Elevations",
        description: "Exterior mockups",
        assigneeId: staff.id,
        assignerId: admin.id,
        status: "todo",
        priority: "medium"
      }
    ]
  });

  console.log("Dummy project and tasks seeded successfully!");
}

seed().catch(console.error).finally(() => prisma.$disconnect());
