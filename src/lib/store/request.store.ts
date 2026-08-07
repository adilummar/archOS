import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import type { FileRequest } from "./types";
import { useActivityStore } from "./activity.store";
import { useNotificationStore } from "./notification.store";
import { useFirmStore } from "./firm.store";
import { uid, nowIso } from "./uid";

type RequesterType = FileRequest["requesterType"];

interface RequestState {
  fileRequests: FileRequest[];

  create: (
    input: Omit<
      FileRequest,
      "id" | "status" | "createdAt" | "requesterName"
    > & { requesterName?: string }
  ) => void;
  fulfill: (
    requestId: string,
    opts: { fulfilledById: string; fulfilledFileId: string }
  ) => void;
  reject: (requestId: string, fulfilledById: string, note: string) => void;
}

const firmStaffIds = (firmId: string): string[] =>
  useFirmStore
    .getState()
    .users.filter((u) => u.firmId === firmId && u.status === "active")
    .map((u) => u.id);

const staffName = (userId: string): string =>
  useFirmStore.getState().users.find((u) => u.id === userId)?.name ?? "Staff";

const requesterName = (type: RequesterType, id: string): string => {
  const { clients, contractors } = useFirmStore.getState();
  const c = type === "client" ? clients.find((x) => x.id === id) : undefined;
  const k = type === "contractor" ? contractors.find((x) => x.id === id) : undefined;
  return c?.name ?? k?.name ?? "Requester";
};

export const useRequestStore = create<RequestState>()(
  persist(
    immer((set, get) => ({
    fileRequests: [],

    create: (input) => {
      const request: FileRequest = {
        ...input,
        id: uid(),
        status: "pending",
        requesterName: input.requesterName ?? requesterName(input.requesterType, input.requestedById),
        createdAt: nowIso(),
      };
      set((state) => {
        state.fileRequests.unshift(request);
      });
      useActivityStore.getState().log({
        firmId: request.firmId,
        projectId: request.projectId,
        entity: "file_request",
        entityId: request.id,
        action: "created",
        description: `${request.requesterName} requested: ${request.description}`,
      });
      useNotificationStore.getState().push({
        firmId: request.firmId,
        userIds: firmStaffIds(request.firmId),
        type: "file_request_new",
        title: "File request",
        body: `${request.requesterName} requested "${request.description}"`,
        linkTo: `/projects/${request.projectId}?tab=requests`,
        entityId: request.id,
      });
    },

    fulfill: (requestId, opts) => {
      const existing = get().fileRequests.find((r) => r.id === requestId);
      set((state) => {
        const r = state.fileRequests.find((x) => x.id === requestId);
        if (r) {
          r.status = "fulfilled";
          r.fulfilledById = opts.fulfilledById;
          r.fulfilledAt = nowIso();
          r.fulfilledFileId = opts.fulfilledFileId;
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          userId: opts.fulfilledById,
          userName: staffName(opts.fulfilledById),
          entity: "file_request",
          entityId: requestId,
          action: "fulfilled",
          description: `File request from ${existing.requesterName} fulfilled`,
        });
        useNotificationStore.getState().push({
          firmId: existing.firmId,
          userIds: firmStaffIds(existing.firmId),
          type: "file_request_fulfilled",
          title: "File request fulfilled",
          body: `${existing.requesterName}'s request "${existing.description}" was fulfilled`,
          linkTo: `/projects/${existing.projectId}?tab=requests`,
          entityId: requestId,
        });
      }
    },

    reject: (requestId, reviewedById, note) => {
      const existing = get().fileRequests.find((r) => r.id === requestId);
      set((state) => {
        const r = state.fileRequests.find((x) => x.id === requestId);
        if (r) {
          r.status = "rejected";
          r.fulfilledById = reviewedById;
          r.fulfilledAt = nowIso();
          r.rejectionNote = note;
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          userId: reviewedById,
          userName: staffName(reviewedById),
          entity: "file_request",
          entityId: requestId,
          action: "rejected",
          description: `File request from ${existing.requesterName} rejected: ${note}`,
        });
      }
    },
  })),
    { name: "archos-request" }
  )
);;
