import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ChatMessage } from "./types";
import { useActivityStore } from "./activity.store";
import { useNotificationStore } from "./notification.store";
import { useFirmStore } from "./firm.store";
import { uid, nowIso } from "./uid";

interface ChatState {
  messages: ChatMessage[];

  send: (
    input: Omit<ChatMessage, "id" | "readBy" | "createdAt">
  ) => void;
  markRead: (messageId: string, userId: string) => void;
}

const firmStaffIds = (firmId: string): string[] =>
  useFirmStore
    .getState()
    .users.filter((u) => u.firmId === firmId && u.status === "active")
    .map((u) => u.id);

const staffName = (userId: string): string =>
  useFirmStore.getState().users.find((u) => u.id === userId)?.name ?? "Staff";

export const useChatStore = create<ChatState>()(
  immer((set, get) => ({
    messages: [],

    send: (input) => {
      const message: ChatMessage = {
        ...input,
        id: uid(),
        readBy: [input.senderId],
        createdAt: nowIso(),
      };
      set((state) => {
        state.messages.unshift(message);
      });
      useActivityStore.getState().log({
        firmId: message.firmId,
        projectId: message.projectId,
        userId: message.senderId,
        userName: message.senderName,
        entity: "chat",
        entityId: message.id,
        action: "sent",
        description: `${message.senderName} posted in project chat`,
      });
      // Notify all other staff in the firm (project is firm-scoped)
      const otherStaff = firmStaffIds(message.firmId).filter(
        (id) => id !== message.senderId
      );
      if (otherStaff.length > 0) {
        useNotificationStore.getState().push({
          firmId: message.firmId,
          userIds: otherStaff,
          type: "task_assigned", // no dedicated chat type; reusing
          title: "New chat message",
          body: `${message.senderName}: ${message.content.slice(0, 80)}${message.content.length > 80 ? "…" : ""}`,
          linkTo: `/projects/${message.projectId}?tab=chat`,
          entityId: message.id,
        });
      }
    },

    markRead: (messageId, userId) => {
      set((state) => {
        const m = state.messages.find((x) => x.id === messageId);
        if (m && !m.readBy.includes(userId)) m.readBy.push(userId);
      });
    },
  }))
);