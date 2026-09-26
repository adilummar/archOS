const fs = require('fs');

let c = fs.readFileSync('src/app/api/v1/projects/route.ts', 'utf8');

const replacement = "const mappedProjects = projects.map((p: any) => ({\n" +
"    ...p,\n" +
"    staffIds: p.staffMembers?.map((sm: any) => sm.userId) || [],\n" +
"    contractorIds: [],\n" +
"    stages: p.stages?.map((s: any) => ({\n" +
"      ...s,\n" +
"      clientApprovedAt: s.clientApprovedAt ? new Date(s.clientApprovedAt).toISOString() : undefined,\n" +
"      startDate: s.startDate ? new Date(s.startDate).toISOString() : undefined,\n" +
"      plannedEndDate: s.plannedEndDate ? new Date(s.plannedEndDate).toISOString() : undefined,\n" +
"      actualEndDate: s.actualEndDate ? new Date(s.actualEndDate).toISOString() : undefined,\n" +
"    })) || [],\n" +
"    currentStageId: p.stages?.find((s: any) => s.status === \"in_progress\")?.id ?? p.stages?.[0]?.id ?? \"\",\n" +
"    startDate: p.startDate ? new Date(p.startDate).toISOString() : new Date().toISOString(),\n" +
"    expectedEndDate: p.expectedEndDate ? new Date(p.expectedEndDate).toISOString() : new Date().toISOString(),\n" +
"    actualEndDate: p.actualEndDate ? new Date(p.actualEndDate).toISOString() : undefined,\n" +
"    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),\n" +
"    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),\n" +
"  }));\n" +
"  return NextResponse.json(mappedProjects);";

c = c.replace('return NextResponse.json(projects);', replacement);

fs.writeFileSync('src/app/api/v1/projects/route.ts', c);
