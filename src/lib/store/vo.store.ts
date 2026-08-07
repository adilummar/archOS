import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import type { VariationOrder, VOStatus } from "./types";
import { useActivityStore } from "./activity.store";
import { useNotificationStore } from "./notification.store";
import { useFirmStore } from "./firm.store";
import { useProjectStore } from "./project.store";
import { uid, nowIso } from "./uid";

interface VoState {
  variationOrders: VariationOrder[];

  /** Create as draft with the next VO number for the project (VO-001…). */
  create: (
    input: Omit<VariationOrder, "id" | "voNumber" | "status" | "createdAt" | "updatedAt">
  ) => void;
  sendToClient: (voId: string) => void;
  /** Client approves → update project fee and timeline; status → approved. */
  clientApprove: (voId: string) => void;
  clientReject: (voId: string, note: string) => void;
  /** Firm-side approve (post client approval). */
  approve: (voId: string, approvedByUserId: string) => void;
  reject: (voId: string, approvedByUserId: string, note?: string) => void;
}

const firmStaffIds = (firmId: string): string[] =>
  useFirmStore
    .getState()
    .users.filter((u) => u.firmId === firmId && u.status === "active")
    .map((u) => u.id);

const staffName = (userId: string): string =>
  useFirmStore.getState().users.find((u) => u.id === userId)?.name ?? "Staff";

export const useVoStore = create<VoState>()(
  persist(
    immer((set, get) => ({
    variationOrders: [],

    create: (input) => {
      const firmVos = get().variationOrders.filter(
        (v) => v.firmId === input.firmId && v.projectId === input.projectId
      );
      const vo: VariationOrder = {
        ...input,
        id: uid(),
        voNumber: `VO-${String(firmVos.length + 1).padStart(3, "0")}`,
        status: "draft",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      set((state) => {
        state.variationOrders.unshift(vo);
      });
      useActivityStore.getState().log({
        firmId: vo.firmId,
        projectId: vo.projectId,
        userId: vo.raisedByUserId,
        userName: staffName(vo.raisedByUserId),
        entity: "vo",
        entityId: vo.id,
        action: "created",
        description: `${vo.voNumber} "${vo.title}" created`,
      });
    },

    sendToClient: (voId) => {
      const existing = get().variationOrders.find((v) => v.id === voId);
      set((state) => {
        const v = state.variationOrders.find((x) => x.id === voId);
        if (v) {
          v.status = "pending_client";
          v.updatedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "vo",
          entityId: voId,
          action: "sent_to_client",
          description: `${existing.voNumber} sent for client approval`,
        });
      }
    },

    clientApprove: (voId) => {
      const existing = get().variationOrders.find((v) => v.id === voId);
      set((state) => {
        const v = state.variationOrders.find((x) => x.id === voId);
        if (v) {
          v.status = "approved";
          v.clientApprovalStatus = "approved";
          v.clientApprovedAt = nowIso();
          v.updatedAt = nowIso();
        }
      });
      if (existing) {
        // Business rule: approved VO → update project fee and timeline
        const project = useProjectStore
          .getState()
          .projects.find((p) => p.id === existing.projectId);
        if (project) {
          const nextFee = project.feeAgreed + existing.feeImpactAmount;
          const nextEnd = new Date(
            new Date(project.expectedEndDate).getTime() +
              existing.timelineImpactDays * 86400000
          )
            .toISOString()
            .slice(0, 10);
          useProjectStore.getState().updateProject(project.id, {
            feeAgreed: nextFee,
            expectedEndDate: nextEnd,
          });
        }
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "vo",
          entityId: voId,
          action: "approved",
          description: `${existing.voNumber} approved by client — fee +${existing.feeImpactAmount}, timeline +${existing.timelineImpactDays}d`,
        });
        useNotificationStore.getState().push({
          firmId: existing.firmId,
          userIds: firmStaffIds(existing.firmId),
          type: "vo_approved",
          title: "Variation order approved",
          body: `${existing.voNumber} "${existing.title}" was approved by the client`,
          linkTo: `/projects/${existing.projectId}?tab=variations`,
          entityId: voId,
        });
      }
    },

    clientReject: (voId, note) => {
      const existing = get().variationOrders.find((v) => v.id === voId);
      set((state) => {
        const v = state.variationOrders.find((x) => x.id === voId);
        if (v) {
          v.status = "rejected";
          v.clientApprovalStatus = "rejected";
          v.clientApprovalNote = note;
          v.updatedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "vo",
          entityId: voId,
          action: "rejected",
          description: `${existing.voNumber} rejected by client: ${note}`,
        });
        useNotificationStore.getState().push({
          firmId: existing.firmId,
          userIds: firmStaffIds(existing.firmId),
          type: "vo_rejected",
          title: "Variation order rejected",
          body: `${existing.voNumber} "${existing.title}" was rejected by the client`,
          linkTo: `/projects/${existing.projectId}?tab=variations`,
          entityId: voId,
        });
      }
    },

    approve: (voId, approvedByUserId) => {
      const existing = get().variationOrders.find((v) => v.id === voId);
      set((state) => {
        const v = state.variationOrders.find((x) => x.id === voId);
        if (v) {
          v.status = "approved";
          v.approvedByUserId = approvedByUserId;
          v.approvedAt = nowIso();
          v.updatedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          userId: approvedByUserId,
          userName: staffName(approvedByUserId),
          entity: "vo",
          entityId: voId,
          action: "approved",
          description: `${existing.voNumber} approved by ${staffName(approvedByUserId)}`,
        });
      }
    },

    reject: (voId, approvedByUserId, note) => {
      const existing = get().variationOrders.find((v) => v.id === voId);
      set((state) => {
        const v = state.variationOrders.find((x) => x.id === voId);
        if (v) {
          v.status = "rejected";
          v.approvedByUserId = approvedByUserId;
          v.approvedAt = nowIso();
          v.clientApprovalNote = note ?? v.clientApprovalNote;
          v.updatedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          userId: approvedByUserId,
          userName: staffName(approvedByUserId),
          entity: "vo",
          entityId: voId,
          action: "rejected",
          description: `${existing.voNumber} rejected by ${staffName(approvedByUserId)}`,
        });
      }
    },
  })),
    { name: "archos-vo" }
  )
);;
