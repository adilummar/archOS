import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import type { Notification, NotificationType } from "./types";
import { uid, nowIso } from "./uid";

export interface NotificationInput {
  firmId: string;
  /** Recipient user ids — caller resolves recipients (no cross-store imports). */
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  linkTo?: string;
  entityId?: string;
}

interface NotificationState {
  notifications: Notification[];
  /** Push to one or more recipients. */
  push: (input: NotificationInput) => void;
  markRead: (id: string) => void;
  markAllRead: (firmId: string, userId: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    immer((set) => ({
    notifications: [],

    push: (input) => {
      const now = nowIso();
      const created: Notification[] = input.userIds.map((userId) => ({
        id: uid(),
        firmId: input.firmId,
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        read: false,
        linkTo: input.linkTo,
        entityId: input.entityId,
        createdAt: now,
      }));
      set((state) => {
        state.notifications.unshift(...created);
      });
    },

    markRead: (id) => {
      set((state) => {
        const n = state.notifications.find((x) => x.id === id);
        if (n) n.read = true;
      });
    },

    markAllRead: (firmId, userId) => {
      set((state) => {
        state.notifications.forEach((n) => {
          if (n.firmId === firmId && n.userId === userId) n.read = true;
        });
      });
    },
  })),
    { name: "archos-notification" }
  )
);;
