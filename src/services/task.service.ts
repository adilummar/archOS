import type { AuthContext } from "./auth.service";
import { prisma } from "@/lib/db";
import { withAuthTx } from "@/lib/db-tx";

/** Convert "YYYY-MM-DD" strings to a full Date object. Passes through Date objects unchanged. */
function toDateTime(val: any): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return val;
  if (typeof val === "string" && val.length === 10) return new Date(val + "T00:00:00.000Z");
  return new Date(val);
}

export async function applySingleStaffAutoAssignment(tx: any, projectId: string, firmId: string) {
  const projectStaff = await tx.projectStaff.findMany({
    where: { projectId },
    include: { user: true }
  });
  const activeStaff = projectStaff.filter((ps: any) => ps.user.role === 'staff' && ps.user.status === 'active' && ps.user.firmId === firmId);
  if (activeStaff.length === 1) {
    await tx.task.updateMany({
      where: {
        projectId,
        firmId,
        status: 'active',
        assigneeId: null,
        isArchived: false
      },
      data: {
        assigneeId: activeStaff[0].userId
      }
    });
  }
}

export async function getTasksByProject(ctx: AuthContext, projectId: string) {
  return withAuthTx(ctx, async (tx) => {
    let projectWhere: any = {
      id: projectId,
      firmId: ctx.firmId,
    };

    if (ctx.role === "admin" || ctx.role === "super_admin" || ctx.role === "accounts") {
      // Admin: firm-scoped access
    } else if (ctx.role === "team_lead") {
      projectWhere.OR = [
        { teamLeadId: ctx.userId },
        { staffMembers: { some: { userId: ctx.userId } } }
      ];
    } else if (ctx.role === "staff") {
      projectWhere.staffMembers = { some: { userId: ctx.userId } };
    } else {
      throw new Error("Project not found");
    }

    const project = await tx.project.findFirst({
      where: projectWhere,
      select: { id: true }
    });

    if (!project) {
      throw new Error("Project not found");
    }

    return tx.task.findMany({
      where: { projectId, firmId: ctx.firmId, isArchived: false },
      include: {
        assignee: { select: { id: true, name: true, avatarInitials: true, avatarColor: true } },
        assigner: { select: { id: true, name: true } },
        subtasks: { orderBy: { createdAt: "asc" } },
        reviewCycles: true,
        stage: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  });
}

export async function getAllTasksByFirm(ctx: AuthContext, firmId: string) {
  return withAuthTx(ctx, async (tx) => {
    let where: any = { firmId, isArchived: false };
    if (ctx.role !== "admin") {
      where = {
        ...where,
        OR: [
          { assigneeId: ctx.userId },
          {
            project: {
              OR: [
                { teamLeadId: ctx.userId },
                { staffMembers: { some: { userId: ctx.userId } } }
              ]
            }
          }
        ]
      };
    }
    return tx.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, stages: { select: { id: true, name: true, order: true } } } },
        stage: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarInitials: true, avatarColor: true } },
        subtasks: { orderBy: { createdAt: "asc" } },
        reviewCycles: true,
      },
      orderBy: { createdAt: "desc" },
    });
  });
}

export async function getTasksByUser(ctx: AuthContext, userId: string, firmId: string, userEmail?: string) {
  return withAuthTx(ctx, async (tx) => {
    let realUserId = userId;
    if (userEmail) {
      const dbUser = await tx.user.findUnique({ where: { email: userEmail }, select: { id: true, firmId: true } });
      if (dbUser) realUserId = dbUser.id;
    }
    return tx.task.findMany({
      where: { assigneeId: realUserId, firmId, isArchived: false },
      include: {
        project: { select: { name: true } },
        subtasks: { orderBy: { createdAt: "asc" } },
        reviewCycles: true,
      },
      orderBy: { createdAt: "desc" },
    });
  });
}

export async function createTask(ctx: AuthContext, data: any) {
  if (ctx.role === 'staff') throw new Error('Unauthorized: Staff cannot create tasks');
  return withAuthTx(ctx, async (tx) => {
    const task = await tx.task.create({ data });
    await tx.activityLog.create({
      data: {
        firmId: data.firmId,
        userId: data.assignerId,
        projectId: data.projectId,
        entity: "task",
        entityId: task.id,
        action: "created",
        description: "Task created",
      },
    });
    
    // Auto-assign if single staff project and task is active
    if (task.status === 'active') {
      await applySingleStaffAutoAssignment(tx, data.projectId, ctx.firmId);
    }
    
    return tx.task.findUnique({ where: { id: task.id } }); // Return updated task
  });
}

export async function updateTask(ctx: AuthContext, taskId: string, data: any, _firmId?: string, _actorId?: string) {
  return withAuthTx(ctx, async (tx) => {
    const existing = await tx.task.findUnique({ where: { id: taskId } });
    if (!existing) throw new Error('Task not found');
    if (ctx.role === 'staff' && existing.assigneeId !== ctx.userId) throw new Error('Unauthorized');
    // Convert date-only strings (YYYY-MM-DD) to full ISO DateTime for Prisma
    const updateData = { ...data };
    if (updateData.dueDate && typeof updateData.dueDate === "string" && updateData.dueDate.length === 10) {
      updateData.dueDate = new Date(updateData.dueDate + "T00:00:00.000Z");
    }
    const task = await tx.task.update({ where: { id: taskId }, data: updateData });
    await tx.activityLog.create({
      data: {
        firmId: ctx.firmId,
        userId: ctx.userId,
        projectId: task.projectId,
        entity: "task",
        entityId: task.id,
        action: "updated",
        description: "Task updated",
      },
    });
    return task;
  });
}

export async function deleteTask(ctx: AuthContext, taskId: string, _firmId?: string, _actorId?: string) {
  if (ctx.role !== 'admin' && ctx.role !== 'team_lead') throw new Error('Unauthorized: Staff cannot delete tasks');
  return withAuthTx(ctx, async (tx) => {
    const existing = await tx.task.findFirst({
      where: { id: taskId, firmId: ctx.firmId },
      include: {
        project: { select: { id: true, teamLeadId: true } },
        reviewCycles: { select: { id: true }, take: 1 },
        assignmentOverrides: { select: { id: true }, take: 1 },
      },
    });
    if (!existing) throw new Error("Task not found");

    if (ctx.role === "team_lead" && existing.project.teamLeadId !== ctx.userId) {
      throw new Error("Unauthorized: Only designated Team Lead can delete tasks in this project");
    }

    const hasTimeSegments = await tx.taskTimeSegment.findFirst({
      where: { taskId },
      select: { id: true },
    });
    if (hasTimeSegments) {
      throw new Error("Cannot hard-delete task with logged time segments; archive it instead.");
    }

    if (existing.reviewCycles.length > 0 || existing.assignmentOverrides.length > 0) {
      throw new Error("Cannot hard-delete task with review or assignment history; archive it instead.");
    }

    if (existing.status !== "future" && existing.status !== "todo") {
      throw new Error("Cannot hard-delete task with active or completed status; archive it instead.");
    }

    await tx.subtask.deleteMany({ where: { taskId } });
    await tx.task.delete({ where: { id: taskId } });

    await tx.activityLog.create({
      data: {
        firmId: ctx.firmId,
        userId: ctx.userId,
        projectId: existing.projectId,
        entity: "task",
        entityId: taskId,
        action: "deleted",
        description: `Task "${existing.title}" deleted`,
      },
    });
    return { success: true, deleted: true };
  });
}

export async function archiveTask(ctx: AuthContext, taskId: string) {
  if (ctx.role !== 'admin' && ctx.role !== 'team_lead') throw new Error('Unauthorized: Staff cannot archive tasks');
  return withAuthTx(ctx, async (tx) => {
    const existing = await tx.task.findFirst({
      where: { id: taskId, firmId: ctx.firmId },
      include: { project: { select: { id: true, teamLeadId: true } } },
    });
    if (!existing) throw new Error("Task not found");

    if (ctx.role === "team_lead" && existing.project.teamLeadId !== ctx.userId) {
      throw new Error("Unauthorized: Only designated Team Lead can archive tasks in this project");
    }

    if (existing.isArchived) {
      return existing;
    }

    const task = await tx.task.update({
      where: { id: taskId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    await tx.activityLog.create({
      data: {
        firmId: ctx.firmId,
        userId: ctx.userId,
        projectId: existing.projectId,
        entity: "task",
        entityId: taskId,
        action: "archived",
        description: `Task "${existing.title}" archived`,
      },
    });

    return task;
  });
}

export async function reorderStageTasks(ctx: AuthContext, stageId: string, orderedTaskIds: string[]) {
  if (ctx.role !== 'admin' && ctx.role !== 'team_lead') throw new Error('Unauthorized');
  if (!orderedTaskIds || orderedTaskIds.length === 0) throw new Error("orderedTaskIds must be a non-empty array");

  return withAuthTx(ctx, async (tx) => {
    const stage = await tx.projectStage.findFirst({
      where: { id: stageId },
      include: { project: { select: { id: true, firmId: true, teamLeadId: true } } },
    });
    if (!stage || stage.project.firmId !== ctx.firmId) throw new Error("Stage not found");

    if (ctx.role === "team_lead" && stage.project.teamLeadId !== ctx.userId) {
      throw new Error("Unauthorized: Only designated Team Lead can reorder tasks in this project");
    }

    const tasks = await tx.task.findMany({
      where: { id: { in: orderedTaskIds }, stageId, firmId: ctx.firmId },
      select: { id: true },
    });
    if (tasks.length !== orderedTaskIds.length) {
      throw new Error("Invalid task list: one or more tasks do not belong to this stage");
    }

    const tempOffset = 10000;
    for (let i = 0; i < orderedTaskIds.length; i++) {
      await tx.task.update({
        where: { id: orderedTaskIds[i] },
        data: { order: tempOffset + i },
      });
    }

    const updatedTasks = [];
    for (let i = 0; i < orderedTaskIds.length; i++) {
      const updated = await tx.task.update({
        where: { id: orderedTaskIds[i] },
        data: { order: i + 1 },
      });
      updatedTasks.push(updated);
    }

    return updatedTasks;
  });
}

export async function reviewTask(ctx: AuthContext, taskId: string, reviewerId: string, firmId: string, data: any) {
  return withAuthTx(ctx, async (tx) => {
    const existing = await tx.task.findUnique({
      where: { id: taskId },
      include: { reviewCycles: true }
    });
    if (!existing) throw new Error("Task not found");
    const revisionNumber = existing.reviewCycles.length + 1;

    const cycle = await tx.taskReviewCycle.create({
      data: {
        taskId,
        reviewerId,
        revisionNumber,
        remark: data.approvalNote,
        statusRequested: data.approvalStatus,
        previousDueDate: existing.dueDate,
        requestedDueDate: data.newDueDate
      }
    });

    const task = await tx.task.update({
      where: { id: taskId },
      data: {
        approvalStatus: data.approvalStatus,
        approvalNote: data.approvalNote,
        approvedById: reviewerId,
        status: data.approvalStatus === "approved" ? "approved" : "in_progress",
        dueDate: toDateTime(data.newDueDate) || existing.dueDate
      }
    });

    await tx.activityLog.create({
      data: {
        firmId,
        userId: reviewerId,
        projectId: existing.projectId,
        entity: "task",
        entityId: taskId,
        action: data.approvalStatus,
        description: "Task reviewed: " + data.approvalStatus
      }
    });

    return task;
  });
}

export async function assignTaskWithOverride(ctx: AuthContext, data: any) {
  return withAuthTx(ctx, async (tx) => {
    const task = await tx.task.findUnique({ where: { id: data.taskId }, include: { project: true } });
    if (!task) throw new Error("Task not found");
    if (task.project.teamLeadId !== ctx.userId) throw new Error("Only Team Lead can override assignment");

    await tx.taskAssignmentOverride.create({
      data: {
        firmId: data.firmId,
        taskId: data.taskId,
        teamLeadId: ctx.userId,
        assigneeId: data.assigneeId,
        requestedDueDate: data.requestedDueDate,
        requiredLeadTimeDays: data.requiredLeadTimeDays,
        actualLeadTimeDays: data.actualLeadTimeDays,
        reason: data.reason,
      }
    });

    const updatedTask = await tx.task.update({
      where: { id: data.taskId },
      data: { assigneeId: data.assigneeId, dueDate: toDateTime(data.requestedDueDate) }
    });

    await tx.activityLog.create({
      data: {
        firmId: data.firmId,
        userId: ctx.userId,
        projectId: task.projectId,
        entity: "task",
        entityId: data.taskId,
        action: "late_assignment_override",
        description: "Task assignment forcefully overridden with reason: " + data.reason
      }
    });

    return updatedTask;
  });
}

export async function getTaskById(ctx: AuthContext, taskId: string) {
  return withAuthTx(ctx, async (tx) => {
    const task = await tx.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            firmId: true,
            teamLeadId: true,
            staffMembers: { select: { userId: true } },
            stages: { select: { id: true, name: true, order: true } },
          },
        },
        stage: { select: { id: true, name: true, order: true } },
        assignee: { select: { id: true, name: true, avatarInitials: true, avatarColor: true } },
        assigner: { select: { id: true, name: true } },
        subtasks: { orderBy: { createdAt: "asc" } },
        reviewCycles: { orderBy: { revisionNumber: "asc" } },
      },
    });

    if (!task || task.firmId !== ctx.firmId) {
      throw Object.assign(new Error("Task not found"), { statusCode: 404 });
    }

    // Role-based scoping
    const isAdmin = ctx.role === "admin" || ctx.role === "super_admin" || ctx.role === "accounts";
    const isLead = ctx.role === "team_lead" && (task.project.teamLeadId === ctx.userId || task.project.staffMembers.some((sm: any) => sm.userId === ctx.userId));
    const isStaffMember = ctx.role === "staff" && (task.assigneeId === ctx.userId || task.project.staffMembers.some((sm: any) => sm.userId === ctx.userId));

    if (!isAdmin && !isLead && !isStaffMember) {
      throw Object.assign(new Error("Task not found"), { statusCode: 404 });
    }

    return task;
  });
}

export async function addSubtask(ctx: AuthContext, data: any) {
  return withAuthTx(ctx, async (tx) => tx.subtask.create({ data }));
}

export async function toggleSubtask(ctx: AuthContext, subtaskId: string, completed?: boolean) {
  return withAuthTx(ctx, async (tx) => {
    const subtask = await tx.subtask.findUnique({
      where: { id: subtaskId },
      include: {
        task: {
          include: {
            project: {
              include: {
                staffMembers: true,
              },
            },
          },
        },
      },
    });

    if (!subtask || subtask.task.firmId !== ctx.firmId) {
      throw Object.assign(new Error("Subtask not found"), { statusCode: 404 });
    }

    // Role-based authorization
    const isAdmin = ctx.role === "admin" || ctx.role === "super_admin";
    const isLead = ctx.role === "team_lead" && (subtask.task.project.teamLeadId === ctx.userId || subtask.task.project.staffMembers.some((sm: any) => sm.userId === ctx.userId));
    const isAssignee = subtask.task.assigneeId === ctx.userId;
    const isProjectStaff = subtask.task.project.staffMembers.some((sm: any) => sm.userId === ctx.userId);

    if (!isAdmin && !isLead && !isAssignee && !isProjectStaff) {
      throw Object.assign(new Error("Unauthorized"), { statusCode: 403 });
    }

    const nextCompleted = typeof completed === "boolean" ? completed : !subtask.completed;
    const completedAt = nextCompleted ? new Date() : null;

    return tx.subtask.update({
      where: { id: subtaskId },
      data: {
        completed: nextCompleted,
        completedAt,
      },
    });
  });
}

export async function deleteSubtask(ctx: AuthContext, subtaskId: string) {
  return withAuthTx(ctx, async (tx) => {
    const subtask = await tx.subtask.findUnique({
      where: { id: subtaskId },
      include: {
        task: {
          include: {
            project: {
              include: {
                staffMembers: true,
              },
            },
          },
        },
      },
    });

    if (!subtask || subtask.task.firmId !== ctx.firmId) {
      throw Object.assign(new Error("Subtask not found"), { statusCode: 404 });
    }

    // Role-based authorization: Admin, Team Lead of the project, Task Assignee, or Subtask Creator
    const isAdmin = ctx.role === "admin" || ctx.role === "super_admin";
    const isLead = ctx.role === "team_lead" && (subtask.task.project.teamLeadId === ctx.userId || subtask.task.project.staffMembers.some((sm: any) => sm.userId === ctx.userId));
    const isAssignee = subtask.task.assigneeId === ctx.userId;
    const isCreator = subtask.createdById === ctx.userId;

    if (!isAdmin && !isLead && !isAssignee && !isCreator) {
      throw Object.assign(new Error("Unauthorized"), { statusCode: 403 });
    }

    await tx.subtask.delete({
      where: { id: subtaskId },
    });

    return { success: true, deleted: true };
  });
}


// ─── SEQUENTIAL WORKFLOW ACTIONS ─────────────────────────────────────────────

export async function getTeamLeadActiveTasks(ctx: AuthContext, teamLeadId: string) {
  return withAuthTx(ctx, async (tx) => {
    const tasks = await tx.task.findMany({
      where: {
        status: { in: ['active', 'todo', 'assigned', 'in_progress', 'revision_requested', 'submitted_for_review', 'review'] },
        project: { teamLeadId }
      },
      include: {
        project: { select: { id: true, name: true, staffMembers: { include: { user: { select: { id: true, name: true } } } } } },
        stage: { select: { id: true, name: true, order: true } },
        assignee: { select: { id: true, name: true, avatarInitials: true, avatarColor: true } },
        subtasks: { orderBy: { createdAt: "asc" } },
      },
      orderBy: [{ stage: { order: 'asc' } }, { order: 'asc' }, { createdAt: 'asc' }]
    });
    const currentByProject = new Map<string, (typeof tasks)[number]>();
    for (const task of tasks) {
      if (!currentByProject.has(task.projectId)) {
        currentByProject.set(task.projectId, task);
      }
    }
    return Array.from(currentByProject.values());
  });
}

export async function getTeamLeadReviewQueue(ctx: AuthContext, teamLeadId: string) {
  return withAuthTx(ctx, async (tx) => {
    return tx.task.findMany({
      where: {
        status: { in: ['submitted_for_review', 'review'] },
        project: { teamLeadId }
      },
      include: {
        project: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarInitials: true, avatarColor: true } },
        reviewCycles: { orderBy: { createdAt: 'desc' }, take: 1 },
        subtasks: { orderBy: { createdAt: "asc" } },
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
        status: { in: ['active', 'todo', 'assigned', 'in_progress', 'revision_requested', 'submitted_for_review', 'review'] }
      },
      include: {
        project: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatarInitials: true, avatarColor: true } },
        reviewCycles: { orderBy: { createdAt: 'desc' }, take: 1 },
        subtasks: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { dueDate: 'asc' }
    });
  });
}

export async function assignActiveTask(ctx: AuthContext, taskId: string, dueDate: Date | null, assigneeId?: string, priority?: string) {
  return withAuthTx(ctx, async (tx) => {
    if (dueDate && Number.isNaN(dueDate.getTime())) {
      throw new Error('Invalid due date');
    }
    const parsedDueDate = dueDate ? toDateTime(dueDate) : null;
    if (dueDate && (!parsedDueDate || Number.isNaN(parsedDueDate.getTime()))) {
      throw new Error('Invalid due date');
    }
    const task = await tx.task.findUnique({
      where: { id: taskId },
      include: { project: { include: { staffMembers: true } } }
    });
    
    if (!task) throw new Error('Task not found');
    if (task.firmId !== ctx.firmId) throw new Error('Task does not belong to this firm');
    if (task.status !== 'active' && task.status !== 'todo') throw new Error('Only active or todo tasks can be assigned');
    if (task.project.teamLeadId !== ctx.userId && ctx.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const firm = await tx.firm.findUnique({ where: { id: task.firmId } });
    if (parsedDueDate && firm && firm.minimumTaskLeadTimeDays > 0) {
      const diffMs = parsedDueDate.getTime() - Date.now();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays < firm.minimumTaskLeadTimeDays) {
         throw new Error(`Due date must satisfy minimum lead time of ${firm.minimumTaskLeadTimeDays} days.`);
      }
    }

    const projectStaff = task.project.staffMembers.filter((sm: any) => sm.userId !== task.project.teamLeadId);
    let finalAssigneeId = assigneeId;
    if (projectStaff.length === 1) {
       finalAssigneeId = projectStaff[0].userId;
    } else if (projectStaff.length === 0) {
       throw new Error('Assignee must be a project staff member');
    } else if (!finalAssigneeId) {
       throw new Error('Project has multiple staff. Assignee must be selected.');
    }

    const isMember = projectStaff.some((sm: any) => sm.userId === finalAssigneeId);
    if (!isMember) {
       throw new Error('Assignee is not a member of this project');
    }

    const assigneeUser = await tx.user.findUnique({ where: { id: finalAssigneeId } });
    if (!assigneeUser) throw new Error('Assignee not found');
    if (assigneeUser.firmId !== ctx.firmId) throw new Error('Assignee does not belong to this firm');
    if (assigneeUser.status !== 'active') throw new Error('Assignee must be an active user');
    if (assigneeUser.role !== 'staff') throw new Error('Assignee must be a staff member');

    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: {
        status: 'assigned',
        assigneeId: finalAssigneeId,
        assignerId: ctx.userId,
        dueDate: parsedDueDate,
        ...(priority ? { priority } : {})
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

/**
 * Internal: starts a task inside an EXISTING transaction.
 * Used by checkIn (attendance) and the public startTask endpoint.
 * Startable states: assigned | active | revision_requested
 * 'in_progress' is a no-op (idempotent).
 */
export async function startTaskTx(tx: any, ctx: AuthContext, taskId: string) {
  const task = await tx.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found');
  if (task.firmId !== ctx.firmId) throw new Error('Task does not belong to this firm');
  if (task.assigneeId !== ctx.userId && ctx.role !== 'admin') {
    throw new Error('Unauthorized: task is not assigned to you');
  }
  if (task.status === 'in_progress') {
    return task; // idempotent
  }
  if (!['assigned', 'active', 'revision_requested'].includes(task.status)) {
    throw new Error(`Task cannot be started from state: ${task.status}`);
  }

  const now = new Date();
  const updatedTask = await tx.task.update({
    where: { id: taskId },
    data: {
      status: 'in_progress',
      startedAt: task.startedAt ?? now,
    }
  });

  await tx.activityLog.create({
    data: {
      firmId: task.firmId,
      userId: ctx.userId,
      projectId: task.projectId,
      entity: 'task',
      entityId: taskId,
      action: 'started',
      description: 'Task started by staff'
    }
  });

  return updatedTask;
}

/** Public endpoint wrapper: starts a task in its own transaction. */
export async function startTask(ctx: AuthContext, taskId: string) {
  return withAuthTx(ctx, async (tx) => startTaskTx(tx, ctx, taskId));
}

export async function submitTaskForReview(ctx: AuthContext, taskId: string) {
  return withAuthTx(ctx, async (tx) => {
    const task = await tx.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');
    if (task.assigneeId !== ctx.userId && ctx.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    if (!['active', 'todo', 'assigned', 'in_progress', 'revision_requested', 'submitted_for_review', 'review'].includes(task.status)) {
      throw new Error('Task cannot be submitted from current state');
    }

    const now = new Date();

    // ── Close any open TaskTimeSegment for this task by this staff ────────────
    // Find open segments for this taskId belonging to this user's sessions
    const openSegments = await tx.taskTimeSegment.findMany({
      where: {
        taskId,
        endTime: null,
        session: { userId: ctx.userId }
      }
    });
    for (const seg of openSegments) {
      const durationMinutes = Math.floor(
        (now.getTime() - new Date(seg.startTime).getTime()) / 60000
      );
      await tx.taskTimeSegment.update({
        where: { id: seg.id },
        data: { endTime: now, durationMinutes }
      });
    }
    // ──────────────────────────────────────────────────────────────────────────

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

export async function requestTaskRevisionSequence(ctx: AuthContext, taskId: string, remark: string, newDueDate?: Date | null) {
  return withAuthTx(ctx, async (tx) => {
    const task = await tx.task.findUnique({ where: { id: taskId }, include: { reviewCycles: true, project: true } });
    if (!task) throw new Error('Task not found');
    if (!remark || remark.trim() === '') throw new Error('Remark is required for revision');
    if (task.project.teamLeadId !== ctx.userId && ctx.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    if (task.status !== 'submitted_for_review') {
      throw new Error('Task is not in review');
    }
    if (newDueDate && Number.isNaN(newDueDate.getTime())) {
      throw new Error('Invalid due date');
    }

    const revisionNumber = task.reviewCycles.length + 1;
    const parsedNewDue = newDueDate ? toDateTime(newDueDate) : undefined;

    await tx.taskReviewCycle.create({
      data: {
        taskId,
        reviewerId: ctx.userId,
        revisionNumber,
        remark,
        statusRequested: 'revision_requested',
        previousDueDate: task.dueDate,
        requestedDueDate: parsedNewDue ?? null
      }
    });

    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: {
        status: 'revision_requested',
        ...(parsedNewDue ? { dueDate: parsedNewDue } : {}),
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
    where: { projectId, isArchived: false },
    orderBy: { order: 'asc' },
    include: {
      tasks: {
        where: { isArchived: false },
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
    
    // Auto-assign if single staff project
    await applySingleStaffAutoAssignment(tx, projectId, ctx.firmId);
  }
}





