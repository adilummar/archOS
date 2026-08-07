import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import type { TimeLog, AttendanceRecord } from "./types";
import { useActivityStore } from "./activity.store";
import { useFirmStore } from "./firm.store";
import { uid, nowIso } from "./uid";

interface ActiveSession {
  id: string; // TimeLog id
  userId: string;
  projectId: string;
  stageId?: string;
  phase: string;
  startTime: string;
}

interface TimeState {
  timeLogs: TimeLog[];
  attendance: AttendanceRecord[];
  activeSessions: ActiveSession[]; // one per user — enforced in actions

  /** Start a clock-in. Returns false if the user already has an active session. */
  startClock: (
    input: { userId: string; firmId: string; projectId: string; stageId?: string; phase: string }
  ) => boolean;
  /** Stop the user's active session and persist it as a TimeLog. */
  stopClock: (userId: string, firmId: string) => void;
  addTimeLog: (log: Omit<TimeLog, "id" | "createdAt">) => void;
  /** Edit a log. If the new duration is LARGER, a team-lead note is required (enforced by caller UI; store records it). */
  updateTimeLog: (logId: string, patch: Partial<TimeLog>) => void;
  /** Remove a log (reducing logged time — allowed directly by user). */
  deleteTimeLog: (logId: string) => void;
  markAttendance: (record: AttendanceRecord) => void;
}

const staffName = (userId: string): string =>
  useFirmStore.getState().users.find((u) => u.id === userId)?.name ?? "Staff";

const minutesBetween = (start: string, end: string): number =>
  Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));

export const useTimeStore = create<TimeState>()(
  persist(
    immer((set, get) => ({
    timeLogs: [],
    attendance: [],
    activeSessions: [],

    startClock: ({ userId, firmId, projectId, stageId, phase }) => {
      const existing = get().activeSessions.find((s) => s.userId === userId);
      if (existing) return false; // one active session per user
      const session: ActiveSession = {
        id: uid(),
        userId,
        projectId,
        stageId,
        phase,
        startTime: nowIso(),
      };
      set((state) => {
        state.activeSessions.push(session);
      });
      useActivityStore.getState().log({
        firmId,
        projectId,
        userId,
        userName: staffName(userId),
        entity: "time",
        entityId: session.id,
        action: "clocked_in",
        description: `${staffName(userId)} started tracking on ${phase}`,
      });
      return true;
    },

    stopClock: (userId, firmId) => {
      const session = get().activeSessions.find((s) => s.userId === userId);
      if (!session) return;
      const end = nowIso();
      const date = new Date().toISOString().slice(0, 10);
      const log: TimeLog = {
        id: session.id,
        firmId,
        userId,
        projectId: session.projectId,
        stageId: session.stageId,
        phase: session.phase,
        startTime: session.startTime,
        endTime: end,
        durationMinutes: minutesBetween(session.startTime, end),
        date,
        isEdited: false,
        createdAt: session.startTime,
      };
      set((state) => {
        state.activeSessions = state.activeSessions.filter((s) => s.userId !== userId);
        state.timeLogs.unshift(log);
      });
      useActivityStore.getState().log({
        firmId,
        projectId: session.projectId,
        userId,
        userName: staffName(userId),
        entity: "time",
        entityId: session.id,
        action: "clocked_out",
        description: `${staffName(userId)} stopped tracking — ${log.durationMinutes} min`,
      });
    },

    addTimeLog: (input) => {
      const log: TimeLog = {
        ...input,
        id: uid(),
        createdAt: nowIso(),
      };
      set((state) => {
        state.timeLogs.unshift(log);
      });
      useActivityStore.getState().log({
        firmId: log.firmId,
        projectId: log.projectId,
        userId: log.userId,
        userName: staffName(log.userId),
        entity: "time",
        entityId: log.id,
        action: "created",
        description: `${staffName(log.userId)} logged ${log.durationMinutes ?? 0} min on ${log.phase}`,
      });
    },

    updateTimeLog: (logId, patch) => {
      const existing = get().timeLogs.find((l) => l.id === logId);
      set((state) => {
        const l = state.timeLogs.find((x) => x.id === logId);
        if (l) {
          // Expanding a past log requires a team-lead note (business rule).
          if (
            patch.durationMinutes !== undefined &&
            existing &&
            patch.durationMinutes > (existing.durationMinutes ?? 0) &&
            !patch.isEdited
          ) {
            l.isEdited = true;
          }
          Object.assign(l, patch, { id: l.id });
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          userId: existing.userId,
          userName: staffName(existing.userId),
          entity: "time",
          entityId: logId,
          action: "edited",
          description: `Time log on ${existing.phase} edited`,
        });
      }
    },

    deleteTimeLog: (logId) => {
      const existing = get().timeLogs.find((l) => l.id === logId);
      set((state) => {
        state.timeLogs = state.timeLogs.filter((l) => l.id !== logId);
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          userId: existing.userId,
          userName: staffName(existing.userId),
          entity: "time",
          entityId: logId,
          action: "deleted",
          description: "Time log removed",
        });
      }
    },

    markAttendance: (record) => {
      set((state) => {
        const idx = state.attendance.findIndex(
          (a) => a.userId === record.userId && a.date === record.date
        );
        if (idx >= 0) state.attendance[idx] = record;
        else state.attendance.push(record);
      });
    },
  })),
    { name: "archos-time" }
  )
);;
