const fs = require('fs');

let c = fs.readFileSync('src/app/api/v1/projects/route.ts', 'utf8');

c = c.replace(
  'return NextResponse.json(projects);',
  const mappedProjects = projects.map((p: any) => ({
    ...p,
    staffIds: p.staffMembers?.map((sm: any) => sm.userId) || [],
    contractorIds: [],
    stages: p.stages?.map((s: any) => ({
      ...s,
      clientApprovedAt: s.clientApprovedAt ? new Date(s.clientApprovedAt).toISOString() : undefined,
      startDate: s.startDate ? new Date(s.startDate).toISOString() : undefined,
      plannedEndDate: s.plannedEndDate ? new Date(s.plannedEndDate).toISOString() : undefined,
      actualEndDate: s.actualEndDate ? new Date(s.actualEndDate).toISOString() : undefined,
    })) || [],
    currentStageId: p.stages?.find((s: any) => s.status === "in_progress")?.id ?? p.stages?.[0]?.id ?? "",
    startDate: p.startDate ? new Date(p.startDate).toISOString() : new Date().toISOString(),
    expectedEndDate: p.expectedEndDate ? new Date(p.expectedEndDate).toISOString() : new Date().toISOString(),
    actualEndDate: p.actualEndDate ? new Date(p.actualEndDate).toISOString() : undefined,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
  }));
  return NextResponse.json(mappedProjects);
);

fs.writeFileSync('src/app/api/v1/projects/route.ts', c);
