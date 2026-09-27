const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get the cda firm
  const firm = await prisma.firm.findUnique({ where: { slug: 'cda' } });
  if (!firm) throw new Error('Firm cda not found');
  console.log('Found firm:', firm.name, firm.id);

  // Check if template already exists
  const existing = await prisma.projectTemplate.findFirst({ where: { firmId: firm.id } });
  if (existing) {
    console.log('Template already exists:', existing.name, existing.id);
    // Check if it has stages
    const stages = await prisma.templateStage.findMany({ where: { templateId: existing.id } });
    console.log('Existing stages:', stages.length);
    if (stages.length > 0) {
      console.log('Template already has stages. Skipping.');
      return;
    }
  }

  // Create or reuse template
  let template = existing;
  if (!template) {
    template = await prisma.projectTemplate.create({
      data: {
        firmId: firm.id,
        name: 'Standard Architecture Project',
        description: 'A complete architecture project workflow from concept to handover.',
        feeStructure: 'per_stage',
        defaultFileRequestWindowDays: 7,
        isDefault: true,
      }
    });
    console.log('Created template:', template.id);
  }

  const stagesData = [
    {
      name: 'Pre Design',
      order: 1,
      description: 'Initial client engagement and site understanding.',
      tasks: [
        { title: 'Client Briefing & Requirements', order: 1, priority: 'high', description: 'Gather all client requirements, budget, and vision.' },
        { title: 'Site Visit & Measurement', order: 2, priority: 'high', description: 'Visit site, take measurements and photographs.' },
        { title: 'Site Analysis Report', order: 3, priority: 'normal', description: 'Analyse site conditions, orientation, access, and surroundings.' },
        { title: 'Feasibility Study', order: 4, priority: 'normal', description: 'Assess feasibility based on regulations and client brief.' },
      ]
    },
    {
      name: 'Concept Design',
      order: 2,
      description: 'Develop and present initial design concepts.',
      tasks: [
        { title: 'Concept Sketches', order: 1, priority: 'high', description: 'Prepare initial hand sketches or rough diagrams.' },
        { title: 'Concept Presentation', order: 2, priority: 'high', description: 'Present design concept to client for feedback.' },
        { title: 'Concept Approval', order: 3, priority: 'high', description: 'Obtain formal client approval on concept direction.' },
      ]
    },
    {
      name: 'Schematic Design',
      order: 3,
      description: 'Develop the approved concept into detailed schematics.',
      tasks: [
        { title: 'Floor Plan Development', order: 1, priority: 'high', description: 'Develop detailed floor plans to scale.' },
        { title: 'Elevation Design', order: 2, priority: 'high', description: 'Design all elevations reflecting the approved concept.' },
        { title: '3D Visualisation', order: 3, priority: 'normal', description: 'Prepare 3D renders for client presentation.' },
        { title: 'Schematic Design Presentation', order: 4, priority: 'high', description: 'Present schematic design to client.' },
        { title: 'Client Schematic Approval', order: 5, priority: 'high', description: 'Obtain formal sign-off on schematic design.' },
      ]
    },
    {
      name: 'Design Development',
      order: 4,
      description: 'Refine design and coordinate with consultants.',
      tasks: [
        { title: 'Detailed Floor Plans', order: 1, priority: 'high', description: 'Finalise and detail all floor plans.' },
        { title: 'Structural Coordination', order: 2, priority: 'high', description: 'Coordinate with structural engineer on framing and columns.' },
        { title: 'MEP Coordination', order: 3, priority: 'normal', description: 'Coordinate mechanical, electrical, and plumbing layouts.' },
        { title: 'Interior Design Development', order: 4, priority: 'normal', description: 'Develop interior finishes, furniture layout, and material palette.' },
        { title: 'DD Presentation & Approval', order: 5, priority: 'high', description: 'Present design development set and obtain approval.' },
      ]
    },
    {
      name: 'Working Drawings',
      order: 5,
      description: 'Prepare construction-ready technical drawings.',
      tasks: [
        { title: 'Architectural Working Drawings', order: 1, priority: 'high', description: 'Prepare complete set of architectural construction drawings.' },
        { title: 'Structural Drawings', order: 2, priority: 'high', description: 'Coordinate and review structural drawings from structural engineer.' },
        { title: 'MEP Drawings', order: 3, priority: 'normal', description: 'Coordinate MEP drawings and review for clashes.' },
        { title: 'Door & Window Schedule', order: 4, priority: 'normal', description: 'Prepare detailed door and window schedule.' },
        { title: 'Working Drawing Review', order: 5, priority: 'high', description: 'Internal review and QA of complete drawing set.' },
      ]
    },
    {
      name: 'Approvals & Permits',
      order: 6,
      description: 'Obtain all statutory approvals and building permits.',
      tasks: [
        { title: 'Prepare Permit Drawings', order: 1, priority: 'high', description: 'Prepare drawings in format required by local authority.' },
        { title: 'Submit Building Permit Application', order: 2, priority: 'high', description: 'Submit application to local municipal authority.' },
        { title: 'Respond to Authority Queries', order: 3, priority: 'normal', description: 'Address any queries from the approving authority.' },
        { title: 'Obtain Building Permit', order: 4, priority: 'high', description: 'Receive and file stamped approval and permit.' },
      ]
    },
    {
      name: 'Construction Administration',
      order: 7,
      description: 'Oversee construction and ensure quality.',
      tasks: [
        { title: 'Contractor Briefing', order: 1, priority: 'high', description: 'Brief contractor on drawings, specifications, and quality standards.' },
        { title: 'Site Visits & Inspection', order: 2, priority: 'high', description: 'Regular site visits to monitor progress and quality.' },
        { title: 'RFI Management', order: 3, priority: 'normal', description: 'Review and respond to contractor Requests for Information.' },
        { title: 'Progress Reporting', order: 4, priority: 'normal', description: 'Prepare and issue monthly progress reports to client.' },
      ]
    },
    {
      name: 'Project Closeout',
      order: 8,
      description: 'Final inspections, handover, and project closure.',
      tasks: [
        { title: 'Snagging / Punch List', order: 1, priority: 'high', description: 'Inspect completed work and prepare snagging list.' },
        { title: 'Snagging Clearance Inspection', order: 2, priority: 'high', description: 'Confirm all snagging items have been resolved.' },
        { title: 'As-Built Drawings', order: 3, priority: 'normal', description: 'Prepare and issue as-built documentation.' },
        { title: 'Client Handover', order: 4, priority: 'high', description: 'Formal handover of project to client with all documents.' },
        { title: 'Project Closure Report', order: 5, priority: 'normal', description: 'Prepare final project closure report and archive files.' },
      ]
    },
  ];

  for (const stageData of stagesData) {
    const stage = await prisma.templateStage.create({
      data: {
        templateId: template.id,
        firmId: firm.id,
        name: stageData.name,
        order: stageData.order,
        description: stageData.description,
        isClientApprovalRequired: false,
        isPaymentMilestone: false,
      }
    });
    console.log(`  Created stage: ${stage.name}`);

    for (const taskData of stageData.tasks) {
      await prisma.templateTask.create({
        data: {
          stageId: stage.id,
          firmId: firm.id,
          title: taskData.title,
          description: taskData.description,
          order: taskData.order,
          priority: taskData.priority,
        }
      });
      console.log(`    Created task: ${taskData.title}`);
    }
  }

  console.log('\n✅ Done! Template fully seeded with', stagesData.length, 'stages.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
