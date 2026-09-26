import { AuthContext } from "./auth.service";
import { prisma } from "@/lib/db";
import { withAuthTx } from "@/lib/db-tx";

export async function getTasksByProject(ctx: AuthContext, projectId: string) {
  return withAuthTx(ctx, async (tx) => {
    return tx.task.findMany({
      where: { projectId },
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
    return tx.task.findMany({
      where: { firmId },
      include: {
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
      where: { assigneeId: realUserId, firmId },
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
    return task;
  });
}

export async function updateTask(ctx: AuthContext, taskId: string, data: any, firmId: string, actorId: string) {
  return withAuthTx(ctx, async (tx) => {
    const task = await tx.task.update({ where: { id: taskId }, data });
    await tx.activityLog.create({
      data: {
        firmId,
        userId: actorId,
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

export async function deleteTask(ctx: AuthContext, taskId: string, firmId: string, actorId: string) {
  return withAuthTx(ctx, async (tx) => {
    const existing = await tx.task.findUnique({ where: { id: taskId } });
    await tx.task.delete({ where: { id: taskId } });
    if (existing) {
      await tx.activityLog.create({
        data: {
          firmId,
          userId: actorId,
          projectId: existing.projectId,
          entity: "task",
          entityId: taskId,
          action: "deleted",
          description: "Task deleted",
        },
      });
    }
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
        dueDate: data.newDueDate || existing.dueDate
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
      data: { assigneeId: data.assigneeId, dueDate: data.requestedDueDate }
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

export async function addSubtask(ctx: AuthContext, data: any) {
  return withAuthTx(ctx, async (tx) => tx.subtask.create({ data }));
}

export async function toggleSubtask(ctx: AuthContext, subtaskId: string, completed: boolean) {
  return withAuthTx(ctx, async (tx) => tx.subtask.update({
    where: { id: subtaskId },
    data: { completed, completedAt: completed ? new Date() : null },
  }));
}
