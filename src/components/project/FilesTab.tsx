"use client";
/**
 * FilesTab — project files list with drawing numbers, status badges, revision chips.
 * Category filter, simulated upload action.
 * Task 4.8.
 */

import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  FileText, Upload, Eye, Share2, CheckCircle2,
  Clock, History, ChevronDown,
} from "lucide-react";
import { useFileStore } from "../../lib/store/file.store";
import { useFirmStore } from "../../lib/store/firm.store";
import { useAuthStore } from "../../lib/store/auth.store";
import { StatusBadge } from "../shared/StatusBadge";
import { Avatar } from "../shared/Avatar";
import { FileDrawer, UploadFileDrawer } from "../drawers/FileDrawer";
import type { Project, ProjectFile } from "../../lib/store/types";

const CATEGORY_LABELS: Record<string, string> = {
  architectural: "Architectural",
  structural: "Structural",
  electrical: "Electrical",
  plumbing: "Plumbing",
  landscape: "Landscape",
  interior: "Interior",
  document: "Document",
  other: "Other",
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);

interface Props {
  project: Project;
}

export function FilesTab({ project }: Props) {
  const { files } = useFileStore();
  const { users } = useFirmStore();
  const { user } = useAuthStore();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const isLead = user?.role === "admin" || user?.role === "team_lead";

  const projectFiles = files.filter((f) => f.projectId === project.id);

  const filteredFiles = projectFiles.filter((f) => {
    if (categoryFilter !== "all" && f.category !== categoryFilter) return false;
    if (statusFilter !== "all" && f.status !== statusFilter) return false;
    return true;
  });

  const categoryOptions = [
    "all",
    ...Array.from(new Set(projectFiles.map((f) => f.category))),
  ];

  return (
    <>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-bg-input)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
            fontSize: "var(--text-sm)",
            cursor: "pointer",
          }}
        >
          <option value="all">All Categories</option>
          {categoryOptions.filter((c) => c !== "all").map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c] ?? c}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-bg-input)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
            fontSize: "var(--text-sm)",
            cursor: "pointer",
          }}
        >
          <option value="all">All Statuses</option>
          <option value="informational">For Discussion</option>
          <option value="final">Final</option>
          <option value="contractor_view">Contractor View</option>
          <option value="superseded">Superseded</option>
        </select>

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          {filteredFiles.length} files
        </span>

        {/* Upload button */}
        {isLead && (
          <button
            onClick={() => setUploadOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-accent)",
              border: "none",
              color: "#fff",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background var(--duration-fast)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-accent)"; }}
          >
            <Upload size={13} strokeWidth={1.5} />
            Upload
          </button>
        )}
      </div>

      {/* File table */}
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "80px 1fr 120px 80px 100px 80px 32px",
            gap: 12,
            padding: "8px 16px",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-bg-input)",
          }}
        >
          {["Drawing #", "File Name", "Category", "Rev", "Status", "Last Updated", ""].map((h) => (
            <span
              key={h}
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {filteredFiles.length === 0 ? (
          <div
            style={{
              padding: "48px 0",
              textAlign: "center",
              color: "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
            }}
          >
            <FileText size={28} strokeWidth={1} style={{ opacity: 0.4, marginBottom: 8, display: "block", margin: "0 auto 8px" }} />
            No files found for this filter.
          </div>
        ) : (
          filteredFiles.map((file, i) => {
            const isExpanded = expandedFile === file.id;
            const isLast = i === filteredFiles.length - 1;
            const latestRev = file.revisions[file.revisions.length - 1];
            const uploader = latestRev ? users.find((u) => u.id === latestRev.uploadedById) : null;

            return (
              <div key={file.id}>
                <div
                  onClick={() => setExpandedFile(isExpanded ? null : file.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 120px 80px 100px 80px 32px",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderBottom: isLast && !isExpanded ? "none" : "1px solid var(--color-border)",
                    cursor: "pointer",
                    transition: "background var(--duration-fast)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "var(--color-bg-card-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  }}
                >
                  {/* Drawing # */}
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {file.drawingNumber ?? "—"}
                  </span>

                  {/* Name */}
                  <div>
                    <p
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: 500,
                        color: "var(--color-text-primary)",
                        margin: 0,
                      }}
                    >
                      {file.name}
                    </p>
                    {file.approvalStatus === "approved" && (
                      <span style={{ fontSize: 10, color: "var(--color-success)" }}>
                        ✓ Approved
                      </span>
                    )}
                  </div>

                  {/* Category */}
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {CATEGORY_LABELS[file.category] ?? file.category}
                  </span>

                  {/* Revision */}
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Rev {file.currentRevision}
                  </span>

                  {/* Status */}
                  <StatusBadge status={file.status} size="sm" />

                  {/* Last updated */}
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    {file.updatedAt ? format(parseISO(file.updatedAt), "d MMM") : "—"}
                  </span>

                  {/* Expand */}
                  <ChevronDown
                    size={14}
                    strokeWidth={1.5}
                    style={{
                      color: "var(--color-text-muted)",
                      transform: isExpanded ? "rotate(180deg)" : "none",
                      transition: "transform var(--duration-fast)",
                    }}
                  />
                </div>

                {/* Expanded: revision history */}
                {isExpanded && (
                  <div
                    style={{
                      background: "var(--color-bg-input)",
                      borderBottom: isLast ? "none" : "1px solid var(--color-border)",
                      padding: "12px 16px 16px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--color-text-muted)",
                        margin: "0 0 10px",
                      }}
                    >
                      Revision History
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[...file.revisions].reverse().map((rev) => {
                        const revUploader = users.find((u) => u.id === rev.uploadedById);
                        return (
                          <div
                            key={rev.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "8px 12px",
                              background: "var(--color-bg-card)",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "var(--text-xs)",
                                fontFamily: "var(--font-mono)",
                                color: "var(--color-text-muted)",
                                width: 40,
                                flexShrink: 0,
                              }}
                            >
                              Rev {rev.revisionNumber}
                            </span>
                            {revUploader && (
                              <Avatar
                                name={revUploader.name}
                                color={revUploader.avatarColor}
                                initials={revUploader.avatarInitials}
                                size="sm"
                              />
                            )}
                            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", flex: 1 }}>
                              {revUploader?.name ?? "Unknown"} ·{" "}
                              {format(parseISO(rev.uploadedAt), "d MMM yyyy")}
                            </span>
                            {rev.sharedWithClient && (
                              <span
                                style={{
                                  fontSize: 10,
                                  color: "var(--color-success)",
                                  background: "var(--color-success-muted)",
                                  padding: "1px 6px",
                                  borderRadius: "var(--radius-sm)",
                                }}
                              >
                                Client
                              </span>
                            )}
                            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                              {Math.round(rev.fileSizeKb / 1024 * 10) / 10} MB
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
