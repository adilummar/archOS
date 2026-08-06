import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { LeaveRequest } from "./types";
import { useActivityStore } from "./activity.store";
import { useNotificationStore } from "./notification.store";
import { useFirmStore } from "./firm.store";
import { uid, nowIso } from "./uid";

interface LeaveState {
  requests: LeaveRequest[];

  submit: (request: Omit<LeaveRequest, "id" | "status" | "createdAt">) => void;
  approve: (requestId: string, approvedById: string) => void;
  reject: (requestId: string, reviewedById: string, note: string) => void;
}

const firmAdminIds = (firmId: string): string[] =>
  useFirmStore
    .getState()
    .users.filter(
      (u) => u.firmId === firmId && u.status === "active" && u.role === "admin"
    )
    .map((u) => u.id);

const staffName = (userId: string): string =>
  useFirmStore.getState().users.find((u) => u.id === userId)?.name ?? "Staff";

export const useLeaveStore = create<LeaveState>()(
  immer((set, get) => ({
    requests: [],

    submit: (input) => {
      const request: LeaveRequest = {
        ...input,
        id: uid(),
        status: "pending",
        createdAt: nowIso(),
      };
      set((state) => {
        state.requests.unshift(request);
      });
      useActivityStore.getState().log({
        firmId: request.firmId,
        userId: request.userId,
        userName: request.userName,
        entity: "leave",
        entityId: request.id,
        action: "requested",
        description: `${request.userName} requested ${request.days} day(s) leave (${request.startDate} → ${request.endDate})`,
      });
      useNotificationStore.getState().push({
        firmId: request.firmId,
        userIds: firmAdminIds(request.firmId),
        type: "leave_request_new",
        title: "Leave request",
        body: `${request.userName} requested ${request.days} day(s) from ${request.startDate}`,
        linkTo: "/leave",
        entityId: request.id,
      });
    },

    approve: (requestId, approvedById) => {
      const existing = get().requests.find((r) => r.id === requestId);
      set((state) => {
        const r = state.requests.find((x) => x.id === requestId);
        if (r) {
          r.status = "approved";
          r.reviewedById = approvedById;
          r.reviewedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          userId: approvedById,
          userName: staffName(approvedById),
          entity: "leave",
          entityId: requestId,
          action: "approved",
          description: `Leave for ${existing.userName} approved`,
        });
        useNotificationStore.getState().push({
          firmId: existing.firmId,
          userIds: [existing.userId],
          type: "leave_approved",
          title: "Leave approved",
          body: `Your leave ${existing.startDate} → ${existing.endDate} was approved`,
          linkTo: "/leave",
          entityId: requestId,
        });
      }
    },

    reject: (requestId, reviewedById, note) => {
      const existing = get().requests.find((r) => r.id === requestId);
      set((state) => {
        const r = state.requests.find((x) => x.id === requestId);
        if (r) {
          r.status = "rejected";
          r.reviewedById = reviewedById;
          r.reviewedAt = nowIso();
          r.rejectionNote = note;
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          userId: reviewedById,
          userName: staffName(reviewedById),
          entity: "leave",
          entityId: requestId,
          action: "rejected",
          description: `Leave for ${existing.userName} rejected: ${note}`,
        });
        useNotificationStore.getState().push({
          firmId: existing.firmId,
          userIds: [existing.userId],
          type: "leave_rejected",
          title: "Leave rejected",
          body: `Your leave ${existing.startDate} → ${existing.endDate} was rejected`,
          linkTo: "/leave",
          entityId: requestId,
        });
      }
    },
  }))
);
