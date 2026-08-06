import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Task, TaskStatus, Priority, ApprovalStatus } from "./types";
import { useActivityStore } from "./activity.store";
import { useNotificationStore } from "./notification.store";
import { useFirmStore } from "./firm.store";
import { uid, nowIso } from "./uid";

export type NewTask = Omit<
  Task,
  "id" | "status" | "subtasks" | "isBlocked" | "createdAt" | "updatedAt"
> & { status?: TaskStatus; id?: string; subtasks?: Task["subtasks"]; isBlocked?: boolean; createdAt?: string; };

interface TaskState {
  tasks: Task[];

  addTask: (task: NewTask) => void;
  updateTask: (taskId: string, patch: Partial<Task>) => void;
  setTaskStatus: (taskId: string, status: TaskStatus) => void;
  setTaskPriority: (taskId: string, priority: Priority) => void;
  setBlocked: (taskId: string, blocked: boolean, reason?: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (
    taskId: string,
    subtask: { title: string; createdById: string; assignedToId: string }
  ) => void;
  setTaskApproval: (
    taskId: string,
    status: ApprovalStatus,
    opts?: { note?: string; approvedById?: string }
  ) => void;
  reassignTask: (taskId: string, assigneeId: string) => void;
}

/** All active staff of a firm — notification recipients. */
const firmStaffIds = (firmId: string): string[] =>
  useFirmStore
    .getState()
    .users.filter((u) => u.firmId === firmId && u.status === "active")
    .map((u) => u.id);

const staffName = (userId: string): string =>
  useFirmStore.getState().users.find((u) => u.id === userId)?.name ?? "Staff";

export const useTaskStore = create<TaskState>()(
  immer((set, get) => ({
    tasks: [],

    addTask: (input) => {
      const task: Task = {
        ...input,
        id: input.id ?? uid(),
        status: input.status ?? "todo",
        subtasks: input.subtasks ?? [],
        isBlocked: input.isBlocked ?? false,
        createdAt: input.createdAt ?? nowIso(),
        updatedAt: nowIso(),
      };
      set((state) => {
        state.tasks.push(task);
      });
      useActivityStore.getState().log({
        firmId: task.firmId,
        projectId: task.projectId,
        userId: task.assignerId === "client" ? undefined : task.assignerId,
        userName: task.assignerId === "client" ? "Client" : staffName(task.assignerId),
        entity: "task",
        entityId: task.id,
        action: "created",
        description: `Task "${task.title}" created`,
      });
      // Notify assignee
      useNotificationStore.getState().push({
        firmId: task.firmId,
        userIds: [task.assigneeId],
        type: "task_assigned",
        title: "Task assigned",
        body: `"${task.title}" was assigned to you`,
        linkTo: `/projects/${task.projectId}?tab=tasks`,
        entityId: task.id,
      });
    },

    updateTask: (taskId, patch) => {
      const existing = get().tasks.find((t) => t.id === taskId);
      set((state) => {
        const t = state.tasks.find((x) => x.id === taskId);
        if (t) Object.assign(t, patch, { id: t.id, updatedAt: nowIso() });
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          userId: existing.assigneeId,
          userName: staffName(existing.assigneeId),
          entity: "task",
          entityId: taskId,
          action: "updated",
          description: `Task "${existing.title}" updated`,
        });
      }
    },

    setTaskStatus: (taskId, status) => {
      const existing = get().tasks.find((t) => t.id === taskId);
      set((state) => {
        const t = state.tasks.find((x) => x.id === taskId);
        if (t) {
          t.status = status;
          if (status === "done") t.completedAt = nowIso();
          if (status === "blocked") t.isBlocked = true;
          t.updatedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          userId: existing.assigneeId,
          userName: staffName(existing.assigneeId),
          entity: "task",
          entityId: taskId,
          action: "status_changed",
          description: `Task "${existing.title}" → ${status}`,
        });
      }
    },

    setTaskPriority: (taskId, priority) => {
      const existing = get().tasks.find((t) => t.id === taskId);
      set((state) => {
        const t = state.tasks.find((x) => x.id === taskId);
        if (t) {
          t.priority = priority;
          t.updatedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "task",
          entityId: taskId,
          action: "updated",
          description: `Task "${existing.title}" priority → ${priority}`,
        });
      }
    },

    setBlocked: (taskId, blocked, reason) => {
      const existing = get().tasks.find((t) => t.id === taskId);
      set((state) => {
        const t = state.tasks.find((x) => x.id === taskId);
        if (t) {
          t.isBlocked = blocked;
          t.blockedReason = reason;
          if (blocked) t.status = "blocked";
          t.updatedAt = nowIso();
        }
      });
      if (existing && blocked) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "task",
          entityId: taskId,
          action: "blocked",
          description: `Task "${existing.title}" blocked${reason ? ` — ${reason}` : ""}`,
        });
      }
    },

    toggleSubtask: (taskId, subtaskId) => {
      const existing = get().tasks.find((t) => t.id === taskId);
      set((state) => {
        const t = state.tasks.find((x) => x.id === taskId);
        const s = t?.subtasks.find((y) => y.id === subtaskId);
        if (s) {
          s.completed = !s.completed;
          s.completedAt = s.completed ? nowIso() : undefined;
        }
        if (t) t.updatedAt = nowIso();
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "task",
          entityId: taskId,
          action: "subtask_toggled",
          description: `Subtask toggled on "${existing.title}"`,
        });
      }
    },

    addSubtask: (taskId, subtask) => {
      const existing = get().tasks.find((t) => t.id === taskId);
      set((state) => {
        const t = state.tasks.find((x) => x.id === taskId);
        if (t) {
          t.subtasks.push({
            id: uid(),
            title: subtask.title,
            completed: false,
            createdById: subtask.createdById,
            assignedToId: subtask.assignedToId,
            createdAt: nowIso(),
          });
          t.updatedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "task",
          entityId: taskId,
          action: "updated",
          description: `Subtask "${subtask.title}" added to "${existing.title}"`,
        });
      }
    },

    setTaskApproval: (taskId, status, opts) => {
      const existing = get().tasks.find((t) => t.id === taskId);
      set((state) => {
        const t = state.tasks.find((x) => x.id === taskId);
        if (t) {
          t.approvalStatus = status;
          t.approvalNote = opts?.note;
          t.approvedById = opts?.approvedById;
          if (status === "approved") t.status = "approved";
          t.updatedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          userId: opts?.approvedById,
          userName: opts?.approvedById ? staffName(opts.approvedById) : undefined,
          entity: "task",
          entityId: taskId,
          action: "approval",
          description: `Approval on "${existing.title}" → ${status}`,
        });
        useNotificationStore.getState().push({
          firmId: existing.firmId,
          userIds: [existing.assigneeId],
          type: status === "approved" ? "task_assigned" : "change_request_resolved",
          title: `Task ${status === "approved" ? "approved" : "sent for revision"}`,
          body: `"${existing.title}" was ${status === "approved" ? "approved" : "sent back with: " + (opts?.note ?? "")}`,
          linkTo: `/projects/${existing.projectId}?tab=tasks`,
          entityId: taskId,
        });
      }
    },

    reassignTask: (taskId, assigneeId) => {
      const existing = get().tasks.find((t) => t.id === taskId);
      set((state) => {
        const t = state.tasks.find((x) => x.id === taskId);
        if (t) {
          t.assigneeId = assigneeId;
          t.updatedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "task",
          entityId: taskId,
          action: "reassigned",
          description: `"${existing.title}" reassigned to ${staffName(assigneeId)}`,
        });
        useNotificationStore.getState().push({
          firmId: existing.firmId,
          userIds: [assigneeId],
          type: "task_assigned",
          title: "Task reassigned",
          body: `"${existing.title}" was assigned to you`,
          linkTo: `/projects/${existing.projectId}?tab=tasks`,
          entityId: taskId,
        });
      }
    },
  }))
);

/** Derived: % complete = closed (approved + done) ÷ total. Never manually overridden. */
export const projectCompletion = (
  tasks: Task[],
  projectId: string
): number => {
  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  if (projectTasks.length === 0) return 0;
  const closed = projectTasks.filter(
    (t) => t.status === "done" || t.status === "approved"
  ).length;
  return Math.round((closed / projectTasks.length) * 100);
};

