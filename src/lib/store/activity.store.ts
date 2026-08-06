import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ActivityLog } from "./types";
import { uid, nowIso } from "./uid";

interface LogInput {
  firmId: string;
  userId?: string;
  userName?: string;
  projectId?: string;
  entity: string;
  entityId: string;
  action: string;
  description: string;
}

interface ActivityState {
  logs: ActivityLog[];
  /** Append a log entry. Caller supplies the userName — no cross-store imports. */
  log: (input: LogInput) => void;
}

export const useActivityStore = create<ActivityState>()(
  immer((set) => ({
    logs: [],

    log: (input) => {
      const entry: ActivityLog = {
        id: uid(),
        firmId: input.firmId,
        userId: input.userId ?? "",
        userName: input.userName ?? "System",
        projectId: input.projectId,
        entity: input.entity,
        entityId: input.entityId,
        action: input.action,
        description: input.description,
        createdAt: nowIso(),
      };
      set((state) => {
        state.logs.unshift(entry); // newest first
      });
    },
  }))
);
