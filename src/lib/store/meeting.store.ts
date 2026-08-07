import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import type { Meeting, MeetingMode, Expense } from "./types";
import { useActivityStore } from "./activity.store";
import { useNotificationStore } from "./notification.store";
import { useFirmStore } from "./firm.store";
import { useFinanceStore } from "./finance.store";
import { uid, nowIso } from "./uid";

interface MeetingState {
  meetings: Meeting[];

  add: (
    input: Omit<
      Meeting,
      "id" | "createdAt"
    >
  ) => void;
  update: (meetingId: string, patch: Partial<Meeting>) => void;
  reschedule: (
    meetingId: string,
    opts: { date: string; time: string; durationMinutes: number; rescheduledById: string }
  ) => void;
  delete: (meetingId: string) => void;
}

const firmStaffIds = (firmId: string): string[] =>
  useFirmStore
    .getState()
    .users.filter((u) => u.firmId === firmId && u.status === "active")
    .map((u) => u.id);

const staffName = (userId: string): string =>
  useFirmStore.getState().users.find((u) => u.id === userId)?.name ?? "Staff";

export const useMeetingStore = create<MeetingState>()(
  persist(
    immer((set, get) => ({
    meetings: [],

    add: (input) => {
      const meeting: Meeting = {
        ...input,
        id: uid(),
        createdAt: nowIso(),
        expense: input.expense
          ? {
              amount: input.expense.amount,
              description: input.expense.description,
              submittedById: input.expense.submittedById,
            }
          : undefined,
      };
      set((state) => {
        state.meetings.unshift(meeting);
      });
      useActivityStore.getState().log({
        firmId: meeting.firmId,
        projectId: meeting.projectId,
        userId: meeting.createdById,
        userName: staffName(meeting.createdById),
        entity: "meeting",
        entityId: meeting.id,
        action: "scheduled",
        description: `Meeting "${meeting.title}" on ${meeting.date} at ${meeting.time}`,
      });
      // Notify attendees
      useNotificationStore.getState().push({
        firmId: meeting.firmId,
        userIds: meeting.attendeeIds,
        type: "meeting_scheduled",
        title: "Meeting scheduled",
        body: `"${meeting.title}" on ${meeting.date} at ${meeting.time}`,
        linkTo: `/projects/${meeting.projectId}?tab=meetings`,
        entityId: meeting.id,
      });
      // Create expense if attached
      if (meeting.expense) {
        useFinanceStore.getState().addExpense({
          firmId: meeting.firmId,
          userId: meeting.expense.submittedById,
          projectId: meeting.projectId,
          meetingId: meeting.id,
          category: "client_meeting",
          amount: meeting.expense.amount,
          description: meeting.expense.description,
          date: meeting.date,
          receiptDescription: "",
        });
      }
    },

    update: (meetingId, patch) => {
      const existing = get().meetings.find((m) => m.id === meetingId);
      set((state) => {
        const m = state.meetings.find((x) => x.id === meetingId);
        if (m) Object.assign(m, patch, { id: m.id });
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "meeting",
          entityId: meetingId,
          action: "updated",
          description: `Meeting "${existing.title}" updated`,
        });
      }
    },

    reschedule: (meetingId, opts) => {
      const existing = get().meetings.find((m) => m.id === meetingId);
      set((state) => {
        const m = state.meetings.find((x) => x.id === meetingId);
        if (m) {
          m.date = opts.date;
          m.time = opts.time;
          m.durationMinutes = opts.durationMinutes;
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          userId: opts.rescheduledById,
          userName: staffName(opts.rescheduledById),
          entity: "meeting",
          entityId: meetingId,
          action: "rescheduled",
          description: `"${existing.title}" moved to ${opts.date} ${opts.time}`,
        });
        useNotificationStore.getState().push({
          firmId: existing.firmId,
          userIds: existing.attendeeIds,
          type: "meeting_rescheduled",
          title: "Meeting rescheduled",
          body: `"${existing.title}" is now on ${opts.date} at ${opts.time}`,
          linkTo: `/projects/${existing.projectId}?tab=meetings`,
          entityId: meetingId,
        });
      }
    },

    delete: (meetingId) => {
      const existing = get().meetings.find((m) => m.id === meetingId);
      set((state) => {
        state.meetings = state.meetings.filter((m) => m.id !== meetingId);
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "meeting",
          entityId: meetingId,
          action: "deleted",
          description: `Meeting "${existing.title}" deleted`,
        });
      }
    },
  })),
    { name: "archos-meeting" }
  )
);;