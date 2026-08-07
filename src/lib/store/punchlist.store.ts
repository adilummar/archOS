import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import type { PunchListItem } from "./types";
import { useActivityStore } from "./activity.store";
import { useNotificationStore } from "./notification.store";
import { useFirmStore } from "./firm.store";
import { uid, nowIso } from "./uid";

interface PunchlistState {
  items: PunchListItem[];

  /** Item numbers auto-assigned per project (PL-001…). */
  addItem: (
    input: Omit<PunchListItem, "id" | "itemNumber" | "status" | "createdAt">
  ) => void;
  resolveByContractor: (itemId: string, note: string) => void;
  confirmByArchitect: (itemId: string, confirmedById: string) => void;
  reopen: (itemId: string, raisedById: string) => void;
}

const staffName = (userId: string): string =>
  useFirmStore.getState().users.find((u) => u.id === userId)?.name ?? "Staff";

const firmStaffIds = (firmId: string): string[] =>
  useFirmStore
    .getState()
    .users.filter((u) => u.firmId === firmId && u.status === "active")
    .map((u) => u.id);

export const usePunchlistStore = create<PunchlistState>()(
  persist(
    immer((set, get) => ({
    items: [],

    addItem: (input) => {
      const firmItems = get().items.filter(
        (i) => i.firmId === input.firmId && i.projectId === input.projectId
      );
      const item: PunchListItem = {
        ...input,
        id: uid(),
        itemNumber: `PL-${String(firmItems.length + 1).padStart(3, "0")}`,
        status: "open",
        createdAt: nowIso(),
      };
      set((state) => {
        state.items.unshift(item);
      });
      useActivityStore.getState().log({
        firmId: input.firmId,
        projectId: input.projectId,
        userId: input.raisedById,
        userName: staffName(input.raisedById),
        entity: "punchlist",
        entityId: item.id,
        action: "created",
        description: `${item.itemNumber} added: ${item.description}`,
      });
      if (input.assignedContractorId) {
        // notify contractor via staff list only (contractor portal reads directly)
        useNotificationStore.getState().push({
          firmId: input.firmId,
          userIds: firmStaffIds(input.firmId),
          type: "punch_list_item_resolved",
          title: "Punch list item assigned",
          body: `${item.itemNumber} — ${item.description}`,
          linkTo: `/projects/${input.projectId}?tab=punchlist`,
          entityId: item.id,
        });
      }
    },

    resolveByContractor: (itemId, note) => {
      const existing = get().items.find((i) => i.id === itemId);
      set((state) => {
        const i = state.items.find((x) => x.id === itemId);
        if (i) {
          i.status = "resolved_by_contractor";
          i.contractorNote = note;
          i.contractorResolvedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "punchlist",
          entityId: itemId,
          action: "resolved",
          description: `${existing.itemNumber} resolved by contractor: ${note}`,
        });
        useNotificationStore.getState().push({
          firmId: existing.firmId,
          userIds: firmStaffIds(existing.firmId),
          type: "punch_list_item_resolved",
          title: "Punch list resolved",
          body: `${existing.itemNumber} marked resolved by contractor`,
          linkTo: `/projects/${existing.projectId}?tab=punchlist`,
          entityId: itemId,
        });
      }
    },

    confirmByArchitect: (itemId, confirmedById) => {
      const existing = get().items.find((i) => i.id === itemId);
      set((state) => {
        const i = state.items.find((x) => x.id === itemId);
        if (i) {
          i.status = "confirmed_by_architect";
          i.architectConfirmedById = confirmedById;
          i.architectConfirmedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          userId: confirmedById,
          userName: staffName(confirmedById),
          entity: "punchlist",
          entityId: itemId,
          action: "confirmed",
          description: `${existing.itemNumber} confirmed by architect`,
        });
      }
    },

    reopen: (itemId, raisedById) => {
      const existing = get().items.find((i) => i.id === itemId);
      set((state) => {
        const i = state.items.find((x) => x.id === itemId);
        if (i) {
          i.status = "open";
          i.contractorNote = undefined;
          i.contractorResolvedAt = undefined;
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          userId: raisedById,
          userName: staffName(raisedById),
          entity: "punchlist",
          entityId: itemId,
          action: "reopened",
          description: `${existing.itemNumber} reopened`,
        });
      }
    },
  })),
    { name: "archos-punchlist" }
  )
);;
