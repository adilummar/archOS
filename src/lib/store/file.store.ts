import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import type {
  ProjectFile,
  FileStatus,
  FileCategory,
  ApprovalStatus,
} from "./types";
import { useActivityStore } from "./activity.store";
import { useNotificationStore } from "./notification.store";
import { useFirmStore } from "./firm.store";
import { toast } from "./toast.store";
import { uid, nowIso } from "./uid";

const DRAWING_PREFIX: Record<FileCategory, string> = {
  architectural: "A",
  structural: "S",
  electrical: "E",
  interior: "I",
  landscape: "L",
  document: "D",
  photo: "P",
  report: "O",
  contract: "O",
  other: "O",
};

interface FileState {
  files: ProjectFile[];

  /** Upload a new file. Auto-assigns the next drawing number per category per project (A-001…). */
  uploadFile: (
    input: Omit<
      ProjectFile,
      "id" | "drawingNumber" | "currentRevision" | "revisions" | "approvalStatus" | "createdAt" | "updatedAt"
    > & { uploadedById: string; fileSizeKb: number; notes?: string }
  ) => ProjectFile | null;
  updateFile: (fileId: string, patch: Partial<ProjectFile>) => void;
  /** informational → final | contractor_view → superseded */
  setFileStatus: (fileId: string, status: FileStatus) => void;
  setFileApproval: (
    fileId: string,
    status: ApprovalStatus,
    opts?: { note?: string; approvedById?: string }
  ) => void;
  addRevision: (
    fileId: string,
    revision: {
      uploadedById: string;
      notes?: string;
      fileSizeKb: number;
      sharedWithClient: boolean;
      sharedWithContractorIds: string[];
    }
  ) => void;
  /** Simulated email on share — fires the "Email sent to …" toast. */
  shareFile: (
    fileId: string,
    opts: { withClient: boolean; contractorIds: string[] }
  ) => void;
}

const staffName = (userId: string): string =>
  useFirmStore.getState().users.find((u) => u.id === userId)?.name ?? "Staff";

export const useFileStore = create<FileState>()(
  persist(
    immer((set, get) => ({
    files: [],

    uploadFile: (input) => {
      const firmFiles = get().files.filter(
        (f) => f.firmId === input.firmId && f.projectId === input.projectId
      );
      const prefix = DRAWING_PREFIX[input.category];
      const categoryCount = firmFiles.filter(
        (f) => f.category === input.category
      ).length;
      const drawingNumber = `${prefix}-${String(categoryCount + 1).padStart(3, "0")}`;

      const file: ProjectFile = {
        ...input,
        id: uid(),
        drawingNumber,
        currentRevision: 1,
        revisions: [
          {
            id: uid(),
            revisionNumber: 1,
            uploadedById: input.uploadedById,
            uploadedAt: nowIso(),
            notes: input.notes,
            fileSizeKb: input.fileSizeKb,
            sharedWithClient: false,
            sharedWithContractorIds: [],
          },
        ],
        approvalStatus: "pending",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      set((state) => {
        state.files.push(file);
      });
      useActivityStore.getState().log({
        firmId: input.firmId,
        projectId: input.projectId,
        entity: "file",
        entityId: file.id,
        action: "uploaded",
        description: `"${file.name}" uploaded as ${drawingNumber}`,
      });
      return file;
    },

    updateFile: (fileId, patch) => {
      const existing = get().files.find((f) => f.id === fileId);
      set((state) => {
        const f = state.files.find((x) => x.id === fileId);
        if (f) Object.assign(f, patch, { id: f.id, updatedAt: nowIso() });
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "file",
          entityId: fileId,
          action: "updated",
          description: `File "${existing.name}" updated`,
        });
      }
    },

    setFileStatus: (fileId, status) => {
      const existing = get().files.find((f) => f.id === fileId);
      set((state) => {
        const f = state.files.find((x) => x.id === fileId);
        if (f) {
          f.status = status;
          f.updatedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "file",
          entityId: fileId,
          action: "status_changed",
          description: `File "${existing.name}" → ${status}`,
        });
      }
    },

    setFileApproval: (fileId, status, opts) => {
      const existing = get().files.find((f) => f.id === fileId);
      set((state) => {
        const f = state.files.find((x) => x.id === fileId);
        if (f) {
          f.approvalStatus = status;
          f.approvalNote = opts?.note;
          f.approvedById = opts?.approvedById;
          f.approvedAt = status === "approved" ? nowIso() : undefined;
          f.updatedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          userId: opts?.approvedById,
          userName: opts?.approvedById ? staffName(opts.approvedById) : undefined,
          entity: "file",
          entityId: fileId,
          action: "approval",
          description: `File "${existing.name}" approval → ${status}`,
        });
      }
    },

    addRevision: (fileId, revision) => {
      const existing = get().files.find((f) => f.id === fileId);
      set((state) => {
        const f = state.files.find((x) => x.id === fileId);
        if (f) {
          const next = f.currentRevision + 1;
          f.currentRevision = next;
          f.revisions.push({
            id: uid(),
            revisionNumber: next,
            uploadedById: revision.uploadedById,
            uploadedAt: nowIso(),
            notes: revision.notes,
            fileSizeKb: revision.fileSizeKb,
            sharedWithClient: revision.sharedWithClient,
            sharedWithContractorIds: revision.sharedWithContractorIds,
          });
          f.updatedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "file",
          entityId: fileId,
          action: "revision_added",
          description: `Revision ${existing.currentRevision + 1} added to "${existing.name}"`,
        });
      }
    },

    shareFile: (fileId, opts) => {
      const existing = get().files.find((f) => f.id === fileId);
      set((state) => {
        const f = state.files.find((x) => x.id === fileId);
        const rev = f?.revisions[f.revisions.length - 1];
        if (f && rev) {
          rev.sharedWithClient = opts.withClient;
          rev.sharedWithContractorIds = opts.contractorIds;
          rev.sharedAt = nowIso();
          f.updatedAt = nowIso();
        }
      });
      if (existing) {
        // Simulated email
        const recipients: string[] = [];
        if (opts.withClient) recipients.push("client");
        opts.contractorIds.forEach((cid) => {
          const c = useFirmStore.getState().contractors.find((x) => x.id === cid);
          if (c) recipients.push(c.name);
        });
        if (recipients.length > 0) {
          toast(`Email sent to ${recipients.join(", ")}`, "success");
        }
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "file",
          entityId: fileId,
          action: "shared",
          description: `"${existing.name}" shared with ${recipients.join(", ") || "no one"}`,
        });
      }
    },
  })),
    { name: "archos-file" }
  )
);;
