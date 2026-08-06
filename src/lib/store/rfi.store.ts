import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { RFI, Priority } from "./types";
import { useActivityStore } from "./activity.store";
import { useNotificationStore } from "./notification.store";
import { useFirmStore } from "./firm.store";
import { useProjectStore } from "./project.store";
import { uid, nowIso } from "./uid";

interface RfiState {
  rfis: RFI[];

  /** Auto-numbered RFI-001, RFI-002 per project. Does not block project progress. */
  create: (
    input: Omit<RFI, "id" | "rfiNumber" | "status" | "createdAt">
  ) => void;
  respond: (
    rfiId: string,
    opts: { respondedById: string; responseText: string; status: "responded" | "closed" }
  ) => void;
  close: (rfiId: string, respondedById: string) => void;
  setPriority: (rfiId: string, priority: Priority) => void;
}

const firmStaffIds = (firmId: string): string[] =>
  useFirmStore
    .getState()
    .users.filter((u) => u.firmId === firmId && u.status === "active")
    .map((u) => u.id);

const staffName = (userId: string): string =>
  useFirmStore.getState().users.find((u) => u.id === userId)?.name ?? "Staff";

export const useRfiStore = create<RfiState>()(
  immer((set, get) => ({
    rfis: [],

    create: (input) => {
      const firmRfis = get().rfis.filter(
        (r) => r.firmId === input.firmId && r.projectId === input.projectId
      );
      const rfi: RFI = {
        ...input,
        id: uid(),
        rfiNumber: `RFI-${String(firmRfis.length + 1).padStart(3, "0")}`,
        status: "open",
        createdAt: nowIso(),
      };
      set((state) => {
        state.rfis.unshift(rfi);
      });
      const project = useProjectStore.getState().projects.find(
        (p) => p.id === input.projectId
      );
      useActivityStore.getState().log({
        firmId: input.firmId,
        projectId: input.projectId,
        entity: "rfi",
        entityId: rfi.id,
        action: "created",
        description: `${rfi.rfiNumber} "${rfi.title}" raised by ${rfi.raiserName}`,
      });
      useNotificationStore.getState().push({
        firmId: input.firmId,
        userIds: firmStaffIds(input.firmId),
        type: "rfi_new",
        title: "New RFI",
        body: `${rfi.rfiNumber} — ${rfi.title} (${project?.name ?? ""})`,
        linkTo: `/projects/${input.projectId}?tab=rfi`,
        entityId: rfi.id,
      });
    },

    respond: (rfiId, opts) => {
      const existing = get().rfis.find((r) => r.id === rfiId);
      set((state) => {
        const r = state.rfis.find((x) => x.id === rfiId);
        if (r) {
          r.status = opts.status;
          r.respondedById = opts.respondedById;
          r.responseText = opts.responseText;
          r.respondedAt = nowIso();
          if (opts.status === "closed") r.closedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          userId: opts.respondedById,
          userName: staffName(opts.respondedById),
          entity: "rfi",
          entityId: rfiId,
          action: "responded",
          description: `${existing.rfiNumber} responded by ${staffName(opts.respondedById)}`,
        });
        useNotificationStore.getState().push({
          firmId: existing.firmId,
          userIds: firmStaffIds(existing.firmId),
          type: "rfi_responded",
          title: "RFI responded",
          body: `${existing.rfiNumber} — ${existing.title} has a response`,
          linkTo: `/projects/${existing.projectId}?tab=rfi`,
          entityId: rfiId,
        });
      }
    },

    close: (rfiId, respondedById) => {
      const existing = get().rfis.find((r) => r.id === rfiId);
      set((state) => {
        const r = state.rfis.find((x) => x.id === rfiId);
        if (r) {
          r.status = "closed";
          r.closedAt = nowIso();
          if (!r.respondedById) r.respondedById = respondedById;
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "rfi",
          entityId: rfiId,
          action: "closed",
          description: `${existing.rfiNumber} closed`,
        });
      }
    },

    setPriority: (rfiId, priority) => {
      const existing = get().rfis.find((r) => r.id === rfiId);
      set((state) => {
        const r = state.rfis.find((x) => x.id === rfiId);
        if (r) r.priority = priority;
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "rfi",
          entityId: rfiId,
          action: "updated",
          description: `${existing.rfiNumber} priority → ${priority}`,
        });
      }
    },
  }))
);
