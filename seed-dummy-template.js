const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const firm = await prisma.firm.findFirst();
    if (!firm) {
      console.log("No firm found.");
      return;
    }

    console.log("Using firm ID:", firm.id);

    const templateName = "Residential Architecture — Full Project Workflow";

    // Delete existing template with same name if it exists (for idempotency)
    const existing = await prisma.projectTemplate.findFirst({
      where: { name: templateName, firmId: firm.id }
    });
    if (existing) {
      console.log("Template already exists, deleting...");
      await prisma.projectTemplate.delete({ where: { id: existing.id } });
    }

    const stages = [
      {
        name: "Pre-Design & Site Study",
        order: 1,
        tasks: [
          { title: "Site Analysis & Measurements", order: 1, description: "Record site dimensions, levels, access points, and major physical constraints." },
          { title: "Client Requirement Collection", order: 2, description: "Document the client's functional, spatial, aesthetic, and budget requirements." },
          { title: "Site Photographs & Documentation", order: 3 },
          { title: "Site Context & Surrounding Analysis", order: 4 },
          { title: "Building Regulation & Feasibility Check", order: 5 },
          { title: "Pre-Design Report Preparation", order: 6 }
        ]
      },
      {
        name: "Concept Design",
        order: 2,
        tasks: [
          { title: "Initial Design Concept", order: 1 },
          { title: "Space Planning & Zoning", order: 2 },
          { title: "Concept Floor Plan", order: 3 },
          { title: "Concept Elevations", order: 4 },
          { title: "Material & Design Direction", order: 5 },
          { title: "Concept Presentation to Client", order: 6 }
        ]
      },
      {
        name: "Design Development",
        order: 3,
        tasks: [
          { title: "Detailed Floor Plan Development", order: 1 },
          { title: "Detailed Elevation Development", order: 2 },
          { title: "Section Development", order: 3 },
          { title: "Door & Window Schedule", order: 4 },
          { title: "Interior Layout Development", order: 5 },
          { title: "Design Development Review", order: 6 }
        ]
      },
      {
        name: "Working Drawings & Documentation",
        order: 4,
        tasks: [
          { title: "Architectural Working Drawings", order: 1 },
          { title: "Detailed Dimensioning", order: 2 },
          { title: "Electrical Layout Coordination", order: 3 },
          { title: "Plumbing Layout Coordination", order: 4 },
          { title: "Construction Detail Drawings", order: 5 },
          { title: "Working Drawing Quality Review", order: 6 }
        ]
      },
      {
        name: "Finalization & Handover",
        order: 5,
        tasks: [
          { title: "Final Drawing Compilation", order: 1 },
          { title: "Drawing Consistency Check", order: 2 },
          { title: "Final Client Review", order: 3 },
          { title: "Final Corrections", order: 4 },
          { title: "Final Documentation Package", order: 5 },
          { title: "Project Handover", order: 6 }
        ]
      }
    ];

    const template = await prisma.projectTemplate.create({
      data: {
        firmId: firm.id,
        name: templateName,
        feeStructure: "lump_sum",
        stages: {
          create: stages.map(stage => ({
            name: stage.name,
            order: stage.order,
            tasks: {
              create: stage.tasks.map(task => ({
                title: task.title,
                order: task.order,
                description: task.description || null
              }))
            }
          }))
        }
      },
      include: {
        stages: {
          include: {
            tasks: true
          }
        }
      }
    });

    console.log("Template created successfully:", template.id);
    let stageCount = template.stages.length;
    let taskCount = 0;
    template.stages.forEach(s => taskCount += s.tasks.length);
    console.log("Stages:", stageCount);
    console.log("Tasks:", taskCount);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
