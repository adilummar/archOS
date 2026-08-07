import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import type { DailySiteReport } from "./types";
import { useActivityStore } from "./activity.store";
import { useFirmStore } from "./firm.store";
import { uid, nowIso } from "./uid";

interface SitereportState {
  reports: DailySiteReport[];

  add: (input: Omit<DailySiteReport, "id" | "createdAt">) => void;
  update: (reportId: string, patch: Partial<DailySiteReport>) => void;
}

const staffName = (userId: string): string =>
  useFirmStore.getState().users.find((u) => u.id === userId)?.name ?? "Staff";

export const useSitereportStore = create<SitereportState>()(
  persist(
    immer((set, get) => ({
    reports: [],

    add: (input) => {
      const report: DailySiteReport = {
        ...input,
        id: uid(),
        createdAt: nowIso(),
      };
      set((state) => {
        state.reports.unshift(report);
      });
      useActivityStore.getState().log({
        firmId: input.firmId,
        projectId: input.projectId,
        userId: input.reportedById,
        userName: staffName(input.reportedById),
        entity: "sitereport",
        entityId: report.id,
        action: "created",
        description: `Daily site report for ${input.date} by ${staffName(input.reportedById)}`,
      });
    },

    update: (reportId, patch) => {
      const existing = get().reports.find((r) => r.id === reportId);
      set((state) => {
        const r = state.reports.find((x) => x.id === reportId);
        if (r) Object.assign(r, patch);
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "sitereport",
          entityId: reportId,
          action: "updated",
          description: "Site report updated",
        });
      }
    },
  })),
    { name: "archos-sitereport" }
  )
);;