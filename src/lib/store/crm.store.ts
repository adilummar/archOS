import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Lead, LeadStage, LeadSource, LeadNote } from "./types";
import { useActivityStore } from "./activity.store";
import { useNotificationStore } from "./notification.store";
import { useFirmStore } from "./firm.store";
import { useProjectStore } from "./project.store";
import { uid, nowIso } from "./uid";

interface CrmState {
  leads: Lead[];

  addLead: (
    input: Omit<Lead, "id" | "notes" | "stage" | "createdAt" | "updatedAt">
  ) => void;
  updateLead: (leadId: string, patch: Partial<Lead>) => void;
  setStage: (leadId: string, stage: LeadStage, opts?: { lostReason?: string }) => void;
  addNote: (leadId: string, note: Omit<LeadNote, "id" | "createdAt">) => void;
  /** Convert a won lead into a project — uses default template if available. */
  convertToProject: (
    leadId: string,
    project: Omit<
      import("./types").Project,
      "id" | "createdAt" | "updatedAt"
    >
  ) => void;
}

const firmStaffIds = (firmId: string): string[] =>
  useFirmStore
    .getState()
    .users.filter((u) => u.firmId === firmId && u.status === "active")
    .map((u) => u.id);

const staffName = (userId: string): string =>
  useFirmStore.getState().users.find((u) => u.id === userId)?.name ?? "Staff";

export const useCrmStore = create<CrmState>()(
  immer((set, get) => ({
    leads: [],

    addLead: (input) => {
      const lead: Lead = {
        ...input,
        id: uid(),
        stage: "new",
        notes: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      set((state) => {
        state.leads.unshift(lead);
      });
      useActivityStore.getState().log({
        firmId: lead.firmId,
        entity: "lead",
        entityId: lead.id,
        action: "created",
        description: `Lead "${lead.name}" (${lead.company ?? "no company"}) added`,
      });
    },

    updateLead: (leadId, patch) => {
      const existing = get().leads.find((l) => l.id === leadId);
      set((state) => {
        const l = state.leads.find((x) => x.id === leadId);
        if (l) Object.assign(l, patch, { id: l.id, updatedAt: nowIso() });
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          entity: "lead",
          entityId: leadId,
          action: "updated",
          description: `Lead "${existing.name}" updated`,
        });
      }
    },

    setStage: (leadId, stage, opts) => {
      const existing = get().leads.find((l) => l.id === leadId);
      set((state) => {
        const l = state.leads.find((x) => x.id === leadId);
        if (l) {
          l.stage = stage;
          if (stage === "lost" && opts?.lostReason) l.lostReason = opts.lostReason;
          l.updatedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          entity: "lead",
          entityId: leadId,
          action: "stage_changed",
          description: `Lead "${existing.name}" → ${stage}${opts?.lostReason ? ` (${opts.lostReason})` : ""}`,
        });
        if (stage === "won") {
          useNotificationStore.getState().push({
            firmId: existing.firmId,
            userIds: firmStaffIds(existing.firmId),
            type: "task_assigned",
            title: "Lead won!",
            body: `"${existing.name}" converted to project opportunity`,
            linkTo: "/crm",
            entityId: leadId,
          });
        }
      }
    },

    addNote: (leadId, note) => {
      const existing = get().leads.find((l) => l.id === leadId);
      set((state) => {
        const l = state.leads.find((x) => x.id === leadId);
        if (l) {
          l.notes.push({
            ...note,
            id: uid(),
            createdAt: nowIso(),
          });
          l.updatedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          entity: "lead",
          entityId: leadId,
          action: "note_added",
          description: `Note added to "${existing.name}"`,
        });
      }
    },

    convertToProject: (leadId, project) => {
      const existing = get().leads.find((l) => l.id === leadId);
      if (!existing) return;
      const fullProject = { ...project, id: uid(), createdAt: nowIso(), updatedAt: nowIso() };
      set((state) => {
        const l = state.leads.find((x) => x.id === leadId);
        if (l) {
          l.stage = "won";
          l.convertedProjectId = fullProject.id;
          l.updatedAt = nowIso();
        }
      });
      useProjectStore.getState().addProject(fullProject);
      useActivityStore.getState().log({
        firmId: existing.firmId,
        entity: "lead",
        entityId: leadId,
        action: "converted",
        description: `Lead "${existing.name}" converted to project "${project.name}"`,
      });
    },
  }))
);
