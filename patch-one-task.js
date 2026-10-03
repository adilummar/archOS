const fs = require('fs');

const file = 'src/services/task.service.ts';
let content = fs.readFileSync(file, 'utf-8');

const getTasksOld = `export async function getTeamLeadActiveTasks(ctx: AuthContext, teamLeadId: string) {
  return withAuthTx(ctx, async (tx) => {
    return tx.task.findMany({
      where: {
        status: { in: ['active', 'assigned', 'in_progress', 'revision_requested'] },
        project: { teamLeadId }
      },
      include: {
        project: { select: { id: true, name: true, staffMembers: { include: { user: { select: { id: true, name: true } } } } } },
        stage: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' }
    });
  });
}`;

const getTasksNew = `export async function getTeamLeadActiveTasks(ctx: AuthContext, teamLeadId: string) {
  return withAuthTx(ctx, async (tx) => {
    const tasks = await tx.task.findMany({
      where: {
        status: { in: ['active', 'assigned', 'in_progress', 'revision_requested'] },
        project: { teamLeadId }
      },
      include: {
        project: { select: { id: true, name: true, staffMembers: { include: { user: { select: { id: true, name: true } } } } } },
        stage: { select: { id: true, name: true, order: true } },
      }
    });

    // Manually sort by stage.order, then task.order, then createdAt to handle nulls robustly
    tasks.sort((a: any, b: any) => {
      const stageA = a.stage?.order ?? 999999;
      const stageB = b.stage?.order ?? 999999;
      if (stageA !== stageB) return stageA - stageB;
      if (a.order !== b.order) return a.order - b.order;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const projectTaskMap = new Map();
    for (const task of tasks) {
      if (!projectTaskMap.has(task.projectId)) {
        projectTaskMap.set(task.projectId, task);
      }
    }

    return Array.from(projectTaskMap.values());
  });
}`;

// I need to use regex because spacing might mismatch.
const regex = /export async function getTeamLeadActiveTasks\([\s\S]*?\}\);[\s\n]*\}/;
content = content.replace(regex, getTasksNew);

fs.writeFileSync(file, content);
console.log('Patched getTeamLeadActiveTasks for EXACTLY ONE task per project');
