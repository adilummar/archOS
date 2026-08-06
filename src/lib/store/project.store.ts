import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Project, ProjectStage } from "./types";
import { useActivityStore } from "./activity.store";
import { useNotificationStore } from "./notification.store";
import { useTaskStore } from "./task.store";
import { useFirmStore } from "./firm.store";
import { uid, nowIso } from "./uid";

type StageStatus = ProjectStage["status"];

interface ProjectState {
  projects: Project[];

  addProject: (project: Project) => void;
  updateProject: (projectId: string, patch: Partial<Project>) => void;
  /** on_hold / cancelled → blocks all tasks; resumed → unblocks. */
  setProjectStatus: (projectId: string, status: Project["status"]) => void;
  addStage: (projectId: string, stage: ProjectStage) => void;
  updateStage: (projectId: string, stageId: string, patch: Partial<ProjectStage>) => void;
  /**
   * Mark a stage complete. If the stage requires client approval:
   *   - sets clientApprovalRequestedAt (stage gate)
   *   - does NOT advance currentStageId until client approves
   * Otherwise advances currentStageId to the next stage and starts it.
   */
  completeStage: (projectId: string, stageId: string) => void;
  /** Client approves the gate — next stage becomes in_progress. */
  approveStageApproval: (projectId: string, stageId: string) => void;
  /** Client requests revision — creates a task for the team lead with the note. */
  requestStageRevision: (projectId: string, stageId: string, note: string) => void;
  /** Internal admin override — force-advance a stage (unlocks next). */
  overrideStage: (projectId: string, stageId: string) => void;
}

const nextStageId = (project: Project, stageId: string): string | null => {
  const idx = project.stages.findIndex((s) => s.id === stageId);
  if (idx === -1 || idx === project.stages.length - 1) return null;
  return project.stages[idx + 1].id;
};

/** Resolve all active staff user ids of a firm (notification recipients). */
const firmStaffIds = (firmId: string): string[] =>
  useFirmStore
    .getState()
    .users.filter((u) => u.firmId === firmId && u.status === "active")
    .map((u) => u.id);

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    projects: [],

    addProject: (project) => {
      set((state) => {
        state.projects.push(project);
      });
      useActivityStore.getState().log({
        firmId: project.firmId,
        projectId: project.id,
        entity: "project",
        entityId: project.id,
        action: "created",
        description: `Project "${project.name}" created for ${project.clientName}`,
      });
      useNotificationStore.getState().push({
        firmId: project.firmId,
        userIds: firmStaffIds(project.firmId),
        type: "task_assigned", // informational broadcast; task types are entity-scoped
        title: "New project",
        body: `"${project.name}" for ${project.clientName} has been created`,
        linkTo: `/projects/${project.id}`,
        entityId: project.id,
      });
    },

    updateProject: (projectId, patch) => {
      const existing = get().projects.find((p) => p.id === projectId);
      set((state) => {
        const p = state.projects.find((x) => x.id === projectId);
        if (p) {
          Object.assign(p, patch, { id: p.id, updatedAt: nowIso() });
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId,
          entity: "project",
          entityId: projectId,
          action: "updated",
          description: `Project "${existing.name}" updated`,
        });
      }
    },

    setProjectStatus: (projectId, status) => {
      const existing = get().projects.find((p) => p.id === projectId);
      set((state) => {
        const p = state.projects.find((x) => x.id === projectId);
        if (p) {
          p.status = status;
          p.updatedAt = nowIso();
        }
      });
      if (existing) {
        const blocked = status === "on_hold" || status === "cancelled";
        // Business rule: block / unblock all tasks in the project
        const tasks = useTaskStore
          .getState()
          .tasks.filter((t) => t.projectId === projectId);
        tasks.forEach((t) => {
          useTaskStore.getState().setBlocked(t.id, blocked, blocked
            ? `Project ${status === "on_hold" ? "on hold" : "cancelled"}`
            : undefined);
        });
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId,
          entity: "project",
          entityId: projectId,
          action: "status_changed",
          description: `"${existing.name}" → ${status}`,
        });
        useNotificationStore.getState().push({
          firmId: existing.firmId,
          userIds: firmStaffIds(existing.firmId),
          type: "task_assigned",
          title: `Project ${status}`,
          body: `"${existing.name}" is now ${status.replace("_", " ")}`,
          linkTo: `/projects/${projectId}`,
          entityId: projectId,
        });
      }
    },

    addStage: (projectId, stage) => {
      const existing = get().projects.find((p) => p.id === projectId);
      set((state) => {
        const p = state.projects.find((x) => x.id === projectId);
        if (p) {
          p.stages.push(stage);
          p.updatedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId,
          entity: "stage",
          entityId: stage.id,
          action: "created",
          description: `Stage "${stage.name}" added to "${existing.name}"`,
        });
      }
    },

    updateStage: (projectId, stageId, patch) => {
      const existing = get().projects.find((p) => p.id === projectId);
      set((state) => {
        const p = state.projects.find((x) => x.id === projectId);
        const s = p?.stages.find((y) => y.id === stageId);
        if (s) Object.assign(s, patch, { id: s.id });
        if (p) p.updatedAt = nowIso();
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId,
          entity: "stage",
          entityId: stageId,
          action: "updated",
          description: "Stage updated",
        });
      }
    },

    completeStage: (projectId, stageId) => {
      const project = get().projects.find((p) => p.id === projectId);
      const stage = project?.stages.find((s) => s.id === stageId);
      if (!project || !stage) return;

      if (stage.isClientApprovalRequired) {
        // Stage gate — request approval, hold progression
        set((state) => {
          const p = state.projects.find((x) => x.id === projectId)!;
          const s = p.stages.find((y) => y.id === stageId)!;
          s.status = "completed";
          s.actualEndDate = nowIso();
          s.clientApprovalRequestedAt = nowIso();
          s.clientApprovalStatus = "pending";
          p.updatedAt = nowIso();
        });
        useNotificationStore.getState().push({
          firmId: project.firmId,
          userIds: firmStaffIds(project.firmId),
          type: "client_approval_needed",
          title: "Client approval needed",
          body: `Stage "${stage.name}" of "${project.name}" awaits client approval`,
          linkTo: `/projects/${projectId}`,
          entityId: projectId,
        });
      } else {
        // No gate — advance directly
        set((state) => {
          const p = state.projects.find((x) => x.id === projectId)!;
          const s = p.stages.find((y) => y.id === stageId)!;
          s.status = "completed";
          s.actualEndDate = nowIso();
          p.updatedAt = nowIso();
        });
        const next = nextStageId(project, stageId);
        if (next) {
          set((state) => {
            const p = state.projects.find((x) => x.id === projectId)!;
            p.currentStageId = next;
            const ns = p.stages.find((y) => y.id === next)!;
            ns.status = "in_progress";
            ns.startDate = ns.startDate ?? nowIso();
            p.updatedAt = nowIso();
          });
        }
      }
      useActivityStore.getState().log({
        firmId: project.firmId,
        projectId,
        entity: "stage",
        entityId: stageId,
        action: "completed",
        description: `Stage "${stage.name}" completed on "${project.name}"`,
      });
    },

    approveStageApproval: (projectId, stageId) => {
      const project = get().projects.find((p) => p.id === projectId);
      const stage = project?.stages.find((s) => s.id === stageId);
      if (!project || !stage) return;
      set((state) => {
        const p = state.projects.find((x) => x.id === projectId)!;
        const s = p.stages.find((y) => y.id === stageId)!;
        s.clientApprovalStatus = "approved";
        s.clientApprovedAt = nowIso();
        p.updatedAt = nowIso();
      });
      const next = nextStageId(project, stageId);
      if (next) {
        set((state) => {
          const p = state.projects.find((x) => x.id === projectId)!;
          p.currentStageId = next;
          const ns = p.stages.find((y) => y.id === next)!;
          ns.status = "in_progress";
          ns.startDate = ns.startDate ?? nowIso();
          p.updatedAt = nowIso();
        });
      }
      useActivityStore.getState().log({
        firmId: project.firmId,
        projectId,
        entity: "stage",
        entityId: stageId,
        action: "approved",
        description: `Client approved stage "${stage.name}"`,
      });
      useNotificationStore.getState().push({
        firmId: project.firmId,
        userIds: firmStaffIds(project.firmId),
        type: "client_approval_needed",
        title: "Stage approved",
        body: `Client approved "${stage.name}" — next stage unlocked`,
        linkTo: `/projects/${projectId}`,
        entityId: projectId,
      });
    },

    requestStageRevision: (projectId, stageId, note) => {
      const project = get().projects.find((p) => p.id === projectId);
      const stage = project?.stages.find((s) => s.id === stageId);
      if (!project || !stage) return;
      set((state) => {
        const p = state.projects.find((x) => x.id === projectId)!;
        const s = p.stages.find((y) => y.id === stageId)!;
        s.clientApprovalStatus = "revision_requested";
        s.clientApprovalNote = note;
        p.updatedAt = nowIso();
      });
      // Business rule: creates a task for the team lead with the client's note
      if (project.teamLeadId) {
        useTaskStore.getState().addTask({
          id: uid(),
          firmId: project.firmId,
          projectId,
          stageId,
          title: `Revise stage: ${stage.name}`,
          description: `Client requested revision: ${note}`,
          assigneeId: project.teamLeadId,
          assignerId: "client",
          status: "todo",
          priority: "high",
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          subtasks: [],
          isBlocked: false,
          createdAt: nowIso(),
        });
      }
      useActivityStore.getState().log({
        firmId: project.firmId,
        projectId,
        entity: "stage",
        entityId: stageId,
        action: "revision_requested",
        description: `Client requested revision on "${stage.name}": ${note}`,
      });
    },

    overrideStage: (projectId, stageId) => {
      const project = get().projects.find((p) => p.id === projectId);
      const stage = project?.stages.find((s) => s.id === stageId);
      if (!project || !stage) return;
      set((state) => {
        const p = state.projects.find((x) => x.id === projectId)!;
        const s = p.stages.find((y) => y.id === stageId)!;
        s.status = "completed";
        s.clientApprovalStatus = s.clientApprovalStatus === "pending"
          ? "approved"
          : s.clientApprovalStatus;
        p.updatedAt = nowIso();
      });
      const next = nextStageId(project, stageId);
      if (next) {
        set((state) => {
          const p = state.projects.find((x) => x.id === projectId)!;
          p.currentStageId = next;
          const ns = p.stages.find((y) => y.id === next)!;
          ns.status = "in_progress";
          ns.startDate = ns.startDate ?? nowIso();
          p.updatedAt = nowIso();
        });
      }
      useActivityStore.getState().log({
        firmId: project.firmId,
        projectId,
        entity: "stage",
        entityId: stageId,
        action: "overridden",
        description: `Stage "${stage.name}" force-completed by admin`,
      });
    },
  }))
);
