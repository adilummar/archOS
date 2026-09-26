
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const firm = await prisma.firm.findFirst();
  if (!firm) return console.log("No firm found.");

  const existingTemplate = await prisma.projectTemplate.findFirst();
  if (existingTemplate) {
    console.log("Template already exists:", existingTemplate.id);
    return;
  }

  const template = await prisma.projectTemplate.create({
    data: {
      firmId: firm.id,
      name: "Residence Project Template",
      description: "Standard flow for residential projects",
      stages: {
        create: [
          {
            name: "Pre-Design",
            order: 1,
            tasks: {
              create: [
                { title: "Site analysis", order: 1 },
                { title: "Client requirements", order: 2 },
                { title: "Initial feasibility", order: 3 },
              ]
            }
          },
          {
            name: "Design Stage",
            order: 2,
            tasks: {
              create: [
                { title: "Concept design", order: 1 },
                { title: "Floor plan", order: 2 },
                { title: "Elevation", order: 3 },
              ]
            }
          },
          {
            name: "Documentation",
            order: 3,
            tasks: {
              create: [
                { title: "Working drawings", order: 1 },
                { title: "Structural coordination", order: 2 },
                { title: "Final documentation", order: 3 },
              ]
            }
          }
        ]
      }
    },
    include: { stages: { include: { tasks: true } } }
  });
  console.log("Created Template:", template.id);
}
main().catch(console.error).finally(() => prisma.$disconnect());

