"use client";
/**
 * FileDrawer — project file detail: revision history, status controls,
 * share toggles (simulated email), approval controls for admin/lead.
 * Task 4.9.
 *
 * Also exports UploadFileDrawer — the "Upload" form (name, category, status,
 * simulated file size) wired to file.store.uploadFile (auto drawing numbering).
 */

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  FileText, Upload, Share2, Check, X, History, Clock, ChevronRight,
} from "lucide-react";
import { Drawer } from "../shared/Drawer";
import { StatusBadge } from "../shared/StatusBadge";
import { Avatar } from "../shared/Avatar";
import { toast } from "../../lib/store/toast.store";
import { useFileStore } from "../../lib/store/file.store";
import { useFirmStore } from "../../lib/store/firm.store";
import { useAuthStore } from "../../lib/store/auth.store";
import type { Project, ProjectFile, FileStatus, FileCategory } from "../../lib/store/types";

const CATEGORY_LABELS: Record<string, string> = {
  architectural: "Architectural",
  structural: "Structural",
  electrical: "Electrical",
  interior: "Interior",
  landscape: "Landscape",
  document: "Document",
  photo: "Photo",
  report: "Report",
  contract: "Contract",
  other: "Other",
};

const CATEGORY_OPTIONS: { value: FileCategory; label: string }[] = [
  { value: "architectural", label: "Architectural" },
  { value: "structural", label: "Structural" },
  { value: "electrical", label: "Electrical" },
  { value: "interior", label: "Interior" },
  { value: "landscape", label: "Landscape" },
  { value: "document", label: "Document" },
  { value: "photo", label: "Photo" },
  { value: "report", label: "Report" },
  { value: "contract", label: "Contract" },
  { value: "other", label: "Other" },
];

interface FileDrawerProps {
  fileId: string | null;
  project: Project;
  onClose: () => void;
}

export function FileDrawer({ fileId, project, onClose }: FileDrawerProps) {
  const file = useFileStore((s) => s.files.find((f) => f.id === fileId));
  const { setFileStatus, setFileApproval, shareFile, addRevision } = useFileStore();
  const { users, contractors } = useFirmStore();
  const { user } = useAuthStore();

  const [shareOpen, setShareOpen] = useState(false);
  const [shareClient, setShareClient] = useState(false);
  const [shareContractors, setShareContractors] = useState<string[]>([]);
  const [addingRevision, setAddingRevision] = useState(false);
  const [revNotes, setRevNotes] = useState("");

  const isLead = user?.role === "admin" || user?.role === "team_lead";
  const isAdmin = user?.role === "admin";
  const firmContractors = useMemo(
    () => contractors.filter((c) => c.firmId === project.firmId),
    [contractors, project.firmId]
  );

  if (!file || !user) return null;

  const latestRev = file.revisions[file.revisions.length - 1];
  const latestUploader = latestRev
    ? users.find((u) => u.id === latestRev.uploadedById)
    : null;

  const toggleShareContractor = (id: string) => {
    setShareContractors((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleShare = () => {
    shareFile(file.id, { withClient: shareClient, contractorIds: shareContractors });
    setShareOpen(false);
    setShareClient(false);
    setShareContractors([]);
  };

  const handleAddRevision = () => {
    // Simulated new revision upload
    addRevision(file.id, {
      uploadedById: user.id,
      notes: revNotes || undefined,
      fileSizeKb: Math.round(800 + Math.random() * 4000),
      sharedWithClient: latestRev?.sharedWithClient ?? false,
      sharedWithContractorIds: latestRev?.sharedWithContractorIds ?? [],
    });
    toast(`Revision ${file.currentRevision + 1} added to "${file.name}"`, "success");
    setAddingRevision(false);
    setRevNotes("");
  };

  return (
    <Drawer open={!!fileId} onClose={onClose} width={520}>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {/* Header */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
              color: "var(--color-text-muted)",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <FileText size={13} strokeWidth={1.5} />
            <span>{project.name}</span>
            <span>&gt;</span>
            <span>{CATEGORY_LABELS[file.category] ?? file.category}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-muted)",
              }}
            >
              {file.drawingNumber ?? "—"}
            </span>
            <h2
              style={{
                margin: 0,
                fontSize: "var(--text-lg)",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                flex: 1,
                minWidth: 0,
              }}
            >
              {file.name}
            </h2>
            <StatusBadge status={file.status} size="sm" />
          </div>
          {file.tags && file.tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {file.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 10,
                    color: "var(--color-text-muted)",
                    background: "var(--color-bg-input)",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Approval controls (admin/lead) */}
        {isLead && file.approvalStatus === "pending" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              background: "var(--color-bg-input)",
              padding: 14,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Check size={13} strokeWidth={1.5} color="var(--color-success)" />
              File requires approval before sharing
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  setFileApproval(file.id, "approved", { approvedById: user.id });
                  toast(`"${file.name}" approved`, "success");
                }}
                style={{
                  flex: 1,
                  background: "var(--color-success)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 14px",
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setFileApproval(file.id, "revision_requested", { approvedById: user.id });
                  toast(`"${file.name}" sent back for revision`, "info");
                }}
                style={{
                  flex: 1,
                  background: "var(--color-warning)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 14px",
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Request Revision
              </button>
            </div>
          </div>
        )}

        {file.approvalStatus === "approved" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "var(--text-sm)",
              color: "var(--color-success)",
            }}
          >
            <Check size={14} strokeWidth={2} />
            Approved{file.approvedAt ? ` on ${format(parseISO(file.approvedAt), "d MMM yyyy")}` : ""}
            {file.approvalNote ? ` — ${file.approvalNote}` : ""}
          </div>
        )}
        {file.approvalStatus === "revision_requested" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "var(--text-sm)",
              color: "var(--color-warning)",
            }}
          >
            <X size={14} strokeWidth={2} />
            Revision requested{file.approvalNote ? ` — ${file.approvalNote}` : ""}
          </div>
        )}

        <div style={{ borderTop: "1px solid var(--color-border)" }} />

        {/* Status flow */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-text-muted)",
              fontWeight: 600,
            }}
          >
            Status Flow
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(
              [
                { value: "informational", label: "For Discussion" },
                { value: "final", label: "Final" },
                { value: "contractor_view", label: "Contractor View" },
                { value: "superseded", label: "Superseded" },
              ] as { value: FileStatus; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                disabled={!isLead}
                onClick={() => {
                  setFileStatus(file.id, opt.value);
                  toast(`"${file.name}" → ${opt.label}`, "success");
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border:
                    file.status === opt.value
                      ? "1px solid var(--color-accent)"
                      : "1px solid var(--color-border)",
                  background:
                    file.status === opt.value
                      ? "var(--color-accent-muted)"
                      : "var(--color-bg-input)",
                  color:
                    file.status === opt.value
                      ? "var(--color-accent)"
                      : "var(--color-text-secondary)",
                  fontSize: "var(--text-xs)",
                  fontWeight: file.status === opt.value ? 600 : 400,
                  cursor: isLead ? "pointer" : "not-allowed",
                  opacity: !isLead ? 0.5 : 1,
                  transition: "all var(--duration-fast)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Share controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-text-muted)",
              fontWeight: 600,
            }}
          >
            Share
          </span>
          {!shareOpen ? (
            <button
              disabled={!isLead || file.approvalStatus !== "approved"}
              onClick={() => setShareOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                alignSelf: "flex-start",
                padding: "7px 14px",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
                fontSize: "var(--text-sm)",
                cursor: file.approvalStatus === "approved" && isLead ? "pointer" : "not-allowed",
                opacity: file.approvalStatus === "approved" && isLead ? 1 : 0.5,
              }}
            >
              <Share2 size={13} strokeWidth={1.5} />
              Share with…
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                background: "var(--color-bg-input)",
                padding: 14,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={shareClient}
                  onChange={(e) => setShareClient(e.target.checked)}
                  style={{ accentColor: "var(--color-accent)" }}
                />
                Client — {project.clientName}
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  Contractors
                </span>
                {firmContractors.map((c) => {
                  const active = shareContractors.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleShareContractor(c.id)}
                        style={{ accentColor: "var(--color-accent)" }}
                      />
                      {c.company} · {c.trade}
                    </label>
                  );
                })}
                {firmContractors.length === 0 && (
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    No contractors on file
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleShare}
                  disabled={!shareClient && shareContractors.length === 0}
                  style={{
                    flex: 1,
                    background: "var(--color-accent)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 14px",
                    fontSize: "var(--text-sm)",
                    fontWeight: 500,
                    cursor: shareClient || shareContractors.length > 0 ? "pointer" : "not-allowed",
                    opacity: shareClient || shareContractors.length > 0 ? 1 : 0.5,
                  }}
                >
                  Send
                </button>
                <button
                  onClick={() => setShareOpen(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-secondary)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 14px",
                    fontSize: "var(--text-sm)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--color-border)" }} />

        {/* Revision history */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-text-muted)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <History size={12} strokeWidth={1.5} />
              Revision History ({file.revisions.length})
            </span>
            {isLead && (
              <button
                onClick={() => setAddingRevision((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "transparent",
                  border: "none",
                  color: "var(--color-accent)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <Upload size={12} strokeWidth={1.5} />
                {addingRevision ? "Cancel" : "Upload Rev"}
              </button>
            )}
          </div>

          {addingRevision && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                background: "var(--color-bg-input)",
                padding: 12,
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
              }}
            >
              <textarea
                value={revNotes}
                onChange={(e) => setRevNotes(e.target.value)}
                placeholder="Revision notes (e.g., 'Updated window schedule')…"
                rows={2}
                style={{
                  width: "100%",
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: 8,
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-primary)",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "var(--font-body)",
                }}
              />
              <button
                onClick={handleAddRevision}
                style={{
                  alignSelf: "flex-end",
                  background: "var(--color-accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  padding: "7px 14px",
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Upload Revision {file.currentRevision + 1}
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...file.revisions].reverse().map((rev) => {
              const uploader = users.find((u) => u.id === rev.uploadedById);
              return (
                <div
                  key={rev.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: "var(--color-bg-card)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-muted)",
                      width: 44,
                      flexShrink: 0,
                    }}
                  >
                    Rev {rev.revisionNumber}
                  </span>
                  {uploader && (
                    <Avatar name={uploader.name} color={uploader.avatarColor} initials={uploader.avatarInitials} size="sm" />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {uploader?.name ?? "Unknown"} · {format(parseISO(rev.uploadedAt), "d MMM yyyy")}
                    </span>
                    {rev.notes && (
                      <span style={{ fontSize: 11, color: "var(--color-text-muted)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {rev.notes}
                      </span>
                    )}
                  </div>
                  {(rev.sharedWithClient || rev.sharedWithContractorIds.length > 0) && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--color-success)",
                        background: "var(--color-success-muted)",
                        padding: "1px 6px",
                        borderRadius: "var(--radius-sm)",
                        flexShrink: 0,
                      }}
                    >
                      Shared
                    </span>
                  )}
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", flexShrink: 0 }}>
                    {Math.round(rev.fileSizeKb / 1024 * 10) / 10} MB
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

// ─── Upload File Drawer ─────────────────────────────────────────────────────────

interface UploadFileDrawerProps {
  open: boolean;
  project: Project;
  onClose: () => void;
}

export function UploadFileDrawer({ open, project, onClose }: UploadFileDrawerProps) {
  const { uploadFile } = useFileStore();
  const { user } = useAuthStore();
  const { users } = useFirmStore();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<FileCategory>("architectural");
  const [status, setStatus] = useState<FileStatus>("informational");
  const [error, setError] = useState("");

  const reset = () => {
    setName("");
    setCategory("architectural");
    setStatus("informational");
    setError("");
  };

  const handleUpload = () => {
    if (!user) return;
    if (!name.trim()) return setError("File name is required.");

    const file = uploadFile({
      firmId: project.firmId,
      projectId: project.id,
      stageId: project.stages.find((s) => s.id === project.currentStageId)?.id,
      name: name.trim(),
      category,
      status,
      tags: [],
      uploadedById: user.id,
      fileSizeKb: Math.round(500 + Math.random() * 6000),
      notes: "Initial upload",
    });

    if (file) {
      toast(`"${name.trim()}" uploaded as ${file.drawingNumber}`, "success");
      reset();
      onClose();
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Upload File" width={480}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {error && (
          <div
            style={{
              background: "var(--color-destructive-muted)",
              color: "var(--color-destructive)",
              fontSize: "var(--text-sm)",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-destructive)",
            }}
          >
            {error}
          </div>
        )}

        <Field label="File Name" required>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Ground Floor Plan"
            style={inputStyle}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value as FileCategory)} style={inputStyle}>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as FileStatus)} style={inputStyle}>
              <option value="informational">For Discussion</option>
              <option value="final">Final</option>
              <option value="contractor_view">Contractor View</option>
            </select>
          </Field>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            background: "var(--color-bg-input)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <Upload size={16} strokeWidth={1.5} color="var(--color-text-muted)" />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              Drawing number auto-assigned
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              e.g., A-001 for the first Architectural file · {users.find((u) => u.id === user?.id)?.name ?? ""} will be recorded as uploader
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            paddingTop: 8,
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 18px",
              fontSize: "var(--text-sm)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--color-accent)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "8px 18px",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Upload size={14} strokeWidth={1.5} />
            Upload
          </button>
        </div>
      </div>
    </Drawer>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--color-bg-input)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  padding: "8px 12px",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-primary)",
  outline: "none",
  boxSizing: "border-box",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
        }}
      >
        {label}
        {required && <span style={{ color: "var(--color-destructive)" }}> *</span>}
      </span>
      {children}
    </label>
  );
}
