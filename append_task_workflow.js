const fs = require('fs');

const appendCode = `
// ─── SEQUENTIAL WORKFLOW ACTIONS ─────────────────────────────────────────────

export async function getTeamLeadActiveTasks(ctx: AuthContext, teamLeadId: string) {
  return withAuthTx(ctx, async (tx) => {
    return tx.task.findMany({
      where: {
        status: 'active',
        project: { teamLeadId }
      },
      include: {
        project: { select: { id: true, name: true, staffMembers: { include: { user: { select: { id: true, name: true } } } } } },
        stage: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' }
    });
  });
}

export async function getTeamLeadReviewQueue(ctx: AuthContext, teamLeadId: string) {
  return withAuthTx(ctx, async (tx) => {
    return tx.task.findMany({
      where: {
        status: 'submitted_for_review',
        project: { teamLeadId }
      },
      include: {
        project: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarInitials: true, avatarColor: true } },
        reviewCycles: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { updatedAt: 'desc' }
    });
  });
}

export async function getStaffAssignedTasks(ctx: AuthContext, staffId: string) {
  return withAuthTx(ctx, async (tx) => {
    return tx.task.findMany({
      where: {
        assigneeId: staffId,
        status: { in: ['assigned', 'in_progress', 'revision_requested'] }
      },
      include: {
        project: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
        reviewCycles: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { dueDate: 'asc' }
    });
  });
}

export async function assignActiveTask(ctx: AuthContext, taskId: string, dueDate: Date, assigneeId?: string) {
  return withAuthTx(ctx, async (tx) => {
    const task = await tx.task.findUnique({
      where: { id: taskId },
      include: { project: { include: { staffMembers: true } } }
    });
    
    if (!task) throw new Error('Task not found');
    if (task.status !== 'active') throw new Error('Only active tasks can be assigned');
    if (task.project.teamLeadId !== ctx.userId && ctx.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const firm = await tx.firm.findUnique({ where: { id: task.firmId } });
    if (firm && firm.minimumTaskLeadTimeDays > 0) {
      const diffMs = dueDate.getTime() - Date.now();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays < firm.minimumTaskLeadTimeDays) {
         throw new Error(\`Due date must satisfy minimum lead time of \${firm.minimumTaskLeadTimeDays} days.\`);
      }
    }

    let finalAssigneeId = assigneeId;
    if (task.project.staffMembers.length === 1) {
       finalAssigneeId = task.project.staffMembers[0].userId;
    } else if (!finalAssigneeId) {
       throw new Error('Project has multiple staff. Assignee must be selected.');
    }

    const isMember = task.project.staffMembers.some((sm: any) => sm.userId === finalAssigneeId);
    if (!isMember) {
       throw new Error('Assignee is not a member of this project');
    }

    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: {
        status: 'assigned',
        assigneeId: finalAssigneeId,
        dueDate
      }
    });

    await tx.activityLog.create({
      data: {
        firmId: task.firmId,
        userId: ctx.userId,
        projectId: task.projectId,
        entity: 'task',
        entityId: taskId,
        action: 'assigned',
        description: 'Task was assigned to staff'
      }
    });

    return updatedTask;
  });
}

export async function submitTaskForReview(ctx: AuthContext, taskId: string) {
  return withAuthTx(ctx, async (tx) => {
    const task = await tx.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');
    if (task.assigneeId !== ctx.userId && ctx.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    if (!['assigned', 'in_progress', 'revision_requested'].includes(task.status)) {
      throw new Error('Task cannot be submitted from current state');
    }

    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: { status: 'submitted_for_review' }
    });

    await tx.activityLog.create({
      data: {
        firmId: task.firmId,
        userId: ctx.userId,
        projectId: task.projectId,
        entity: 'task',
        entityId: taskId,
        action: 'submitted_for_review',
        description: 'Task submitted for review'
      }
    });

    return updatedTask;
  });
}

export async function requestTaskRevisionSequence(ctx: AuthContext, taskId: string, remark: string, newDueDate: Date) {
  return withAuthTx(ctx, async (tx) => {
    const task = await tx.task.findUnique({ where: { id: taskId }, include: { reviewCycles: true, project: true } });
    if (!task) throw new Error('Task not found');
    if (task.project.teamLeadId !== ctx.userId && ctx.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    if (task.status !== 'submitted_for_review') {
      throw new Error('Task is not in review');
    }

    const revisionNumber = task.reviewCycles.length + 1;

    await tx.taskReviewCycle.create({
      data: {
        taskId,
        reviewerId: ctx.userId,
        revisionNumber,
        remark,
        statusRequested: 'revision_requested',
        previousDueDate: task.dueDate,
        requestedDueDate: newDueDate
      }
    });

    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: {
        status: 'revision_requested',
        dueDate: newDueDate,
        approvalStatus: 'revision_requested',
        approvalNote: remark,
        approvedById: ctx.userId
      }
    });

    await tx.activityLog.create({
      data: {
        firmId: task.firmId,
        userId: ctx.userId,
        projectId: task.projectId,
        entity: 'task',
        entityId: taskId,
        action: 'revision_requested',
        description: 'Revision requested for task'
      }
    });

    return updatedTask;
  });
}

export async function approveTaskSequence(ctx: AuthContext, taskId: string) {
  return withAuthTx(ctx, async (tx) => {
    const task = await tx.task.findUnique({ where: { id: taskId }, include: { reviewCycles: true, project: true } });
    if (!task) throw new Error('Task not found');
    if (task.project.teamLeadId !== ctx.userId && ctx.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    if (task.status !== 'submitted_for_review') {
      throw new Error('Task is not in review');
    }

    const revisionNumber = task.reviewCycles.length + 1;

    await tx.taskReviewCycle.create({
      data: {
        taskId,
        reviewerId: ctx.userId,
        revisionNumber,
        remark: 'Approved',
        statusRequested: 'approved',
        previousDueDate: task.dueDate,
        requestedDueDate: null
      }
    });

    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        approvalStatus: 'approved',
        approvalNote: 'Approved',
        approvedById: ctx.userId
      }
    });

    await tx.activityLog.create({
      data: {
        firmId: task.firmId,
        userId: ctx.userId,
        projectId: task.projectId,
        entity: 'task',
        entityId: taskId,
        action: 'approved',
        description: 'Task approved and completed'
      }
    });

    await activateNextTask(ctx, tx, task.projectId);

    return updatedTask;
  });
}

async function activateNextTask(ctx: AuthContext, tx: any, projectId: string) {
  const stages = await tx.projectStage.findMany({
    where: { projectId },
    orderBy: { order: 'asc' },
    include: {
      tasks: {
        orderBy: { order: 'asc' }
      }
    }
  });

  let nextTaskToActivate = null;
  let currentActiveStageId = null;

  for (const stage of stages) {
    let stageAllCompleted = true;
    for (const task of stage.tasks) {
      if (task.status !== 'completed') {
        stageAllCompleted = false;
        if (!nextTaskToActivate) {
          nextTaskToActivate = task;
          currentActiveStageId = stage.id;
        }
      }
    }
    
    if (stageAllCompleted && stage.status !== 'completed') {
       await tx.projectStage.update({
         where: { id: stage.id },
         data: { status: 'completed', actualEndDate: new Date() }
       });
    } else if (!stageAllCompleted && stage.id === currentActiveStageId && stage.status === 'pending') {
       await tx.projectStage.update({
         where: { id: stage.id },
         data: { status: 'in_progress', startDate: new Date() }
       });
    }
  }

  if (nextTaskToActivate && nextTaskToActivate.status === 'future') {
    await tx.task.update({
      where: { id: nextTaskToActivate.id },
      data: { status: 'active' }
    });
  }
}
`;

fs.appendFileSync('src/services/task.service.ts', '\n' + appendCode);
console.log('Appended sequence functions to task.service.ts');
