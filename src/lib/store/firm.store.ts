import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import type {
  Client,
  Contractor,
  Firm,
  ProjectTemplate,
  User,
} from "./types";
import { useActivityStore } from "./activity.store";
import { useNotificationStore } from "./notification.store";
import { uid, nowIso } from "./uid";

interface FirmState {
  firms: Firm[];
  users: User[];
  clients: Client[];
  contractors: Contractor[];
  templates: ProjectTemplate[];

  addFirm: (firm: Firm) => void;
  updateFirm: (firmId: string, patch: Partial<Firm>) => void;
  updateFirmSettings: (firmId: string, patch: Partial<Firm["settings"]>) => void;

  addUser: (user: User) => void;
  updateUser: (userId: string, patch: Partial<User>) => void;
  /** Discontinue a staff member — tasks remain; admin must reassign (task.store). */
  discontinueUser: (userId: string) => void;

  addClient: (client: Client) => void;
  updateClient: (clientId: string, patch: Partial<Client>) => void;
  addContractor: (contractor: Contractor) => void;
  updateContractor: (contractorId: string, patch: Partial<Contractor>) => void;

  addTemplate: (template: ProjectTemplate) => void;
  updateTemplate: (templateId: string, patch: Partial<ProjectTemplate>) => void;
}

export const useFirmStore = create<FirmState>()(
  persist(
    immer((set, get) => ({
    firms: [],
    users: [],
    clients: [],
    contractors: [],
    templates: [],

    addFirm: (firm) => {
      set((state) => {
        state.firms.push(firm);
      });
    },

    updateFirm: (firmId, patch) => {
      set((state) => {
        const f = state.firms.find((x) => x.id === firmId);
        if (f) Object.assign(f, patch, { id: f.id });
      });
      useActivityStore.getState().log({
        firmId,
        entity: "firm",
        entityId: firmId,
        action: "updated",
        description: `Firm profile updated`,
      });
    },

    updateFirmSettings: (firmId, patch) => {
      set((state) => {
        const f = state.firms.find((x) => x.id === firmId);
        if (f) Object.assign(f.settings, patch);
      });
      useActivityStore.getState().log({
        firmId,
        entity: "firm",
        entityId: firmId,
        action: "settings_updated",
        description: "Firm settings updated",
      });
    },

    addUser: (user) => {
      set((state) => {
        state.users.push(user);
      });
      useActivityStore.getState().log({
        firmId: user.firmId,
        userId: user.id,
        userName: user.name,
        entity: "user",
        entityId: user.id,
        action: "created",
        description: `${user.name} joined as ${user.designation}`,
      });
    },

    updateUser: (userId, patch) => {
      const existing = get().users.find((u) => u.id === userId);
      set((state) => {
        const u = state.users.find((x) => x.id === userId);
        if (u) Object.assign(u, patch, { id: u.id });
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          userId,
          userName: existing.name,
          entity: "user",
          entityId: userId,
          action: "updated",
          description: `${existing.name}'s profile updated`,
        });
      }
    },

    discontinueUser: (userId) => {
      const existing = get().users.find((u) => u.id === userId);
      set((state) => {
        const u = state.users.find((x) => x.id === userId);
        if (u) {
          u.status = "discontinued";
          u.discontinuedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          userId,
          userName: existing.name,
          entity: "user",
          entityId: userId,
          action: "discontinued",
          description: `${existing.name} discontinued`,
        });
      }
    },

    addClient: (client) => {
      set((state) => {
        state.clients.push(client);
      });
      useActivityStore.getState().log({
        firmId: client.firmId,
        entity: "client",
        entityId: client.id,
        action: "created",
        description: `Client ${client.name} added`,
      });
    },

    updateClient: (clientId, patch) => {
      const existing = get().clients.find((c) => c.id === clientId);
      set((state) => {
        const c = state.clients.find((x) => x.id === clientId);
        if (c) Object.assign(c, patch, { id: c.id });
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          entity: "client",
          entityId: clientId,
          action: "updated",
          description: `Client ${existing.name} updated`,
        });
      }
    },

    addContractor: (contractor) => {
      set((state) => {
        state.contractors.push(contractor);
      });
      useActivityStore.getState().log({
        firmId: contractor.firmId,
        entity: "contractor",
        entityId: contractor.id,
        action: "created",
        description: `Contractor ${contractor.name} (${contractor.trade}) added`,
      });
    },

    updateContractor: (contractorId, patch) => {
      const existing = get().contractors.find((c) => c.id === contractorId);
      set((state) => {
        const c = state.contractors.find((x) => x.id === contractorId);
        if (c) Object.assign(c, patch, { id: c.id });
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          entity: "contractor",
          entityId: contractorId,
          action: "updated",
          description: `Contractor ${existing.name} updated`,
        });
      }
    },

    addTemplate: (template) => {
      set((state) => {
        state.templates.push(template);
      });
      useActivityStore.getState().log({
        firmId: template.firmId,
        entity: "template",
        entityId: template.id,
        action: "created",
        description: `Template "${template.name}" created`,
      });
    },

    updateTemplate: (templateId, patch) => {
      const existing = get().templates.find((t) => t.id === templateId);
      set((state) => {
        const t = state.templates.find((x) => x.id === templateId);
        if (t) Object.assign(t, patch, { id: t.id });
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          entity: "template",
          entityId: templateId,
          action: "updated",
          description: `Template "${existing.name}" updated`,
        });
      }
    },
  })),
    { name: "archos-firm" }
  )
);;
