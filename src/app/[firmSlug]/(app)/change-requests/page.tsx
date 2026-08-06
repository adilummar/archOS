"use client";
/**
 * Change Requests Page — firm-wide file/change requests from clients & contractors.
 * Shows all FileRequests for the firm with filter tabs (All | Pending | Fulfilled | Rejected).
 * Admin/team_lead: inline approve (fulfill) + reject with reason textarea.
 * Staff: read-only view.
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, isPast, parseISO } from "date-fns";
import {
  FileText,
  Check,
  X,
  ChevronRight,
  CalendarClock,
  AlertCircle,
} from "lucide-react";
import { useRequestStore } from "@/lib/store/request.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { toast } from "@/lib/store/toast.store";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar } from "@/components/shared/Avatar";
import type { FileRequest, RequestStatus } from "@/lib/store/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabFilter = "all" | RequestStatus;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr
      style={{
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {[200, 120, 140, 80, 80, 100, 120, 160].map((w, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div
            style={{
              height: 14,
              width: w,
              borderRadius: "var(--radius-sm)",
              background: "var(--color-bg-card-hover)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg, transparent 0%, var(--color-bg-sidebar) 50%, transparent 100%)",
                animation: "shimmer 1.5s infinite",
              }}
            />
          </div>
        </td>
      ))}
    </tr>
  );
}

function PageSkeleton() {
  return (
    <div
      style={{
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      {/* Title skeleton */}
      <div
        style={{
          width: 200,
          height: 28,
          borderRadius: "var(--radius-sm)",
          background: "var(--color-bg-card)",
        }}
      />
      {/* Tabs skeleton */}
      <div style={{ display: "flex", gap: 8 }}>
        {[80, 90, 100, 80].map((w, i) => (
          <div
            key={i}
            style={{
              width: w,
              height: 34,
              borderRadius: "var(--radius-sm)",
              background: "var(--color-bg-card)",
            }}
          />
        ))}
      </div>
      {/* Table skeleton */}
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Inline Reject Form ───────────────────────────────────────────────────────

interface RejectFormProps {
  onConfirm: (note: string) => void;
  onCancel: () => void;
}

function RejectForm({ onConfirm, onCancel }: RejectFormProps) {
  const [note, setNote] = useState("");
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "10px 12px",
        background: "var(--color-bg-canvas)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
        minWidth: 240,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <p
        style={{
          margin: 0,
          fontSize: "var(--text-xs)",
          color: "var(--color-text-secondary)",
          fontWeight: 500,
        }}
      >
        Rejection reason (optional)
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Enter a reason…"
        autoFocus
        style={{
          resize: "vertical",
          background: "var(--color-bg-input)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          color: "var(--color-text-primary)",
          fontSize: "var(--text-xs)",
          padding: "6px 8px",
          outline: "none",
          fontFamily: "inherit",
        }}
        onFocus={(e) =>
          (e.currentTarget.style.borderColor = "var(--color-destructive)")
        }
        onBlur={(e) =>
          (e.currentTarget.style.borderColor = "var(--color-border)")
        }
      />
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          style={{
            background: "none",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-text-muted)",
            fontSize: "var(--text-xs)",
            padding: "4px 10px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(note.trim())}
          style={{
            background: "var(--color-destructive)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-text-inverse)",
            fontSize: "var(--text-xs)",
            fontWeight: 500,
            padding: "4px 10px",
            cursor: "pointer",
          }}
        >
          Confirm Reject
        </button>
      </div>
    </div>
  );
}

// ─── Requester type badge ─────────────────────────────────────────────────────

function RequesterBadge({ type }: { type: "client" | "contractor" }) {
  const isClient = type === "client";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 7px",
        borderRadius: "var(--radius-sm)",
        color: isClient ? "var(--color-info)" : "var(--color-accent)",
        background: isClient
          ? "var(--color-info-muted)"
          : "var(--color-accent-muted)",
        whiteSpace: "nowrap",
      }}
    >
      {isClient ? "Client" : "Contractor"}
    </span>
  );
}

// ─── Due date badge ───────────────────────────────────────────────────────────

function DueDateBadge({ dateStr }: { dateStr: string }) {
  const overdue = isPast(parseISO(dateStr));
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 7px",
        borderRadius: "var(--radius-sm)",
        color: overdue ? "var(--color-destructive)" : "var(--color-warning)",
        background: overdue
          ? "var(--color-destructive-muted)"
          : "var(--color-warning-muted)",
        whiteSpace: "nowrap",
      }}
    >
      <CalendarClock size={11} />
      {overdue ? "Overdue · " : ""}
      {format(parseISO(dateStr), "d MMM yyyy")}
    </span>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────

interface TabBtnProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function TabBtn({ label, count, active, onClick }: TabBtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: "var(--radius-sm)",
        border: active
          ? "1px solid var(--color-accent)"
          : "1px solid var(--color-border)",
        background: active ? "var(--color-accent-muted)" : "var(--color-bg-card)",
        color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
        fontSize: "var(--text-sm)",
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        transition: "all var(--duration-fast)",
      }}
    >
      {label}
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          padding: "1px 6px",
          borderRadius: 10,
          background: active ? "var(--color-accent)" : "var(--color-bg-input)",
          color: active ? "var(--color-text-inverse)" : "var(--color-text-muted)",
          minWidth: 20,
          textAlign: "center",
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChangeRequestsPage() {
  const params = useParams<{ firmSlug: string }>();
  const router = useRouter();

  const { fileRequests, fulfill, reject } = useRequestStore();
  const { user, firm } = useAuthStore();
  const { projects } = useProjectStore();
  const { users } = useFirmStore();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // 1.2s skeleton
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const firmRequests = useMemo<FileRequest[]>(() => {
    if (!firm) return [];
    return fileRequests
      .filter((r) => r.firmId === firm.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [fileRequests, firm]);

  // Tab counts
  const counts = useMemo(() => {
    const all = firmRequests.length;
    const pending = firmRequests.filter((r) => r.status === "pending").length;
    const fulfilled = firmRequests.filter((r) => r.status === "fulfilled").length;
    const rejected = firmRequests.filter((r) => r.status === "rejected").length;
    return { all, pending, fulfilled, rejected };
  }, [firmRequests]);

  const displayed = useMemo<FileRequest[]>(() => {
    if (activeTab === "all") return firmRequests;
    return firmRequests.filter((r) => r.status === activeTab);
  }, [firmRequests, activeTab]);

  const canAction =
    user?.role === "admin" || user?.role === "team_lead";

  const getProject = (projectId: string) =>
    projects.find((p) => p.id === projectId);

  const getFulfilledByUser = (userId: string | undefined) =>
    userId ? users.find((u) => u.id === userId) : undefined;

  const handleFulfill = (req: FileRequest) => {
    if (!user) return;
    fulfill(req.id, { fulfilledById: user.id, fulfilledFileId: "" });
    toast(`Request from ${req.requesterName} approved`, "success");
  };

  const handleReject = (req: FileRequest, note: string) => {
    if (!user) return;
    reject(req.id, user.id, note);
    setRejectingId(null);
    toast(`Request from ${req.requesterName} rejected`, "default");
  };

  const thStyle: React.CSSProperties = {
    padding: "10px 16px",
    fontSize: "var(--text-xs)",
    fontWeight: 500,
    color: "var(--color-text-muted)",
    textAlign: "left",
    whiteSpace: "nowrap",
  };

  if (loading) return <PageSkeleton />;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <div
        style={{
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          background: "var(--color-bg-canvas)",
          minHeight: "100%",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "var(--text-xl)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
              }}
            >
              Change Requests
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "var(--text-xs)",
                color: "var(--color-text-muted)",
              }}
            >
              File &amp; change requests raised by clients and contractors
            </p>
          </div>
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "4px 10px",
            }}
          >
            {displayed.length} request{displayed.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <TabBtn
            label="All"
            count={counts.all}
            active={activeTab === "all"}
            onClick={() => setActiveTab("all")}
          />
          <TabBtn
            label="Pending"
            count={counts.pending}
            active={activeTab === "pending"}
            onClick={() => setActiveTab("pending")}
          />
          <TabBtn
            label="Fulfilled"
            count={counts.fulfilled}
            active={activeTab === "fulfilled"}
            onClick={() => setActiveTab("fulfilled")}
          />
          <TabBtn
            label="Rejected"
            count={counts.rejected}
            active={activeTab === "rejected"}
            onClick={() => setActiveTab("rejected")}
          />
        </div>

        {/* Table / Empty state */}
        {displayed.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "72px 0",
              gap: 12,
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-muted)",
            }}
          >
            <FileText size={44} strokeWidth={1} opacity={0.35} />
            <p
              style={{
                margin: 0,
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                fontSize: "var(--text-sm)",
              }}
            >
              {activeTab === "pending"
                ? "No pending requests — all requests have been addressed"
                : activeTab === "fulfilled"
                ? "No fulfilled requests yet"
                : activeTab === "rejected"
                ? "No rejected requests"
                : "No change requests yet"}
            </p>
            <p style={{ margin: 0, fontSize: "var(--text-xs)" }}>
              {activeTab === "pending"
                ? "New requests from clients or contractors will appear here."
                : "Switch tabs to see other requests."}
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    background: "var(--color-bg-sidebar)",
                  }}
                >
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Request</th>
                  <th style={thStyle}>Requester</th>
                  <th style={thStyle}>Project</th>
                  <th style={thStyle}>Due Date</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Reviewed By</th>
                  <th style={thStyle}>Raised</th>
                  {canAction && (
                    <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {displayed.map((req, idx) => {
                  const project = getProject(req.projectId);
                  const reviewedBy = getFulfilledByUser(req.fulfilledById);
                  const isRejectingThis = rejectingId === req.id;
                  const isPending = req.status === "pending";

                  return (
                    <tr
                      key={req.id}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        transition: "background var(--duration-fast)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--color-bg-card-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      {/* CR number */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--text-xs)",
                            color: "var(--color-text-muted)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          CR-{String(idx + 1).padStart(3, "0")}
                        </span>
                      </td>

                      {/* Title + description */}
                      <td style={{ padding: "14px 16px", maxWidth: 260 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "var(--text-sm)",
                            fontWeight: 500,
                            color: "var(--color-text-primary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {req.description.split("\n")[0].slice(0, 60) ||
                            "Untitled request"}
                        </p>
                        {req.description.length > 60 && (
                          <p
                            style={{
                              margin: "2px 0 0",
                              fontSize: "var(--text-xs)",
                              color: "var(--color-text-muted)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 240,
                            }}
                          >
                            {req.description.slice(60, 120)}…
                          </p>
                        )}
                        {req.rejectionNote && (
                          <p
                            style={{
                              margin: "4px 0 0",
                              fontSize: "var(--text-xs)",
                              color: "var(--color-destructive)",
                              fontStyle: "italic",
                            }}
                          >
                            Rejected: {req.rejectionNote}
                          </p>
                        )}
                      </td>

                      {/* Requester */}
                      <td style={{ padding: "14px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--color-text-secondary)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {req.requesterName}
                          </span>
                          <RequesterBadge type={req.requesterType} />
                        </div>
                      </td>

                      {/* Project */}
                      <td style={{ padding: "14px 16px" }}>
                        {project ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/${params.firmSlug}/projects/${project.id}`
                              );
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              background: "var(--color-bg-input)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "var(--radius-sm)",
                              color: "var(--color-text-secondary)",
                              fontSize: "var(--text-xs)",
                              padding: "3px 8px",
                              cursor: "pointer",
                              maxWidth: 160,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              transition: "color var(--duration-fast)",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color =
                                "var(--color-accent)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color =
                                "var(--color-text-secondary)")
                            }
                          >
                            {project.name}
                            <ChevronRight size={10} />
                          </button>
                        ) : (
                          <span
                            style={{
                              color: "var(--color-text-muted)",
                              fontSize: "var(--text-xs)",
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>

                      {/* Due date */}
                      <td style={{ padding: "14px 16px" }}>
                        <DueDateBadge dateStr={req.responseDueDate} />
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 16px" }}>
                        <StatusBadge status={req.status} size="sm" />
                      </td>

                      {/* Reviewed by */}
                      <td style={{ padding: "14px 16px" }}>
                        {reviewedBy ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Avatar
                              name={reviewedBy.name}
                              size="sm"
                              color={reviewedBy.avatarColor}
                            />
                            <span
                              style={{
                                fontSize: "var(--text-xs)",
                                color: "var(--color-text-secondary)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {reviewedBy.name}
                            </span>
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>

                      {/* Raised date */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--color-text-muted)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {format(parseISO(req.createdAt), "d MMM yyyy")}
                        </span>
                      </td>

                      {/* Actions */}
                      {canAction && (
                        <td
                          style={{
                            padding: "14px 16px",
                            textAlign: "right",
                            verticalAlign: "top",
                          }}
                        >
                          {isPending ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                gap: 6,
                              }}
                            >
                              {!isRejectingThis ? (
                                <div
                                  style={{ display: "flex", gap: 6 }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Approve button */}
                                  <button
                                    onClick={() => handleFulfill(req)}
                                    title="Approve request"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      padding: "5px 10px",
                                      borderRadius: "var(--radius-sm)",
                                      background: "var(--color-success-muted)",
                                      border:
                                        "1px solid var(--color-success)",
                                      color: "var(--color-success)",
                                      fontSize: "var(--text-xs)",
                                      fontWeight: 500,
                                      cursor: "pointer",
                                      transition: "all var(--duration-fast)",
                                      whiteSpace: "nowrap",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background =
                                        "var(--color-success)";
                                      e.currentTarget.style.color =
                                        "var(--color-text-inverse)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background =
                                        "var(--color-success-muted)";
                                      e.currentTarget.style.color =
                                        "var(--color-success)";
                                    }}
                                  >
                                    <Check size={12} strokeWidth={2.5} />
                                    Approve
                                  </button>

                                  {/* Reject button */}
                                  <button
                                    onClick={() => setRejectingId(req.id)}
                                    title="Reject request"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      padding: "5px 10px",
                                      borderRadius: "var(--radius-sm)",
                                      background:
                                        "var(--color-destructive-muted)",
                                      border:
                                        "1px solid var(--color-destructive)",
                                      color: "var(--color-destructive)",
                                      fontSize: "var(--text-xs)",
                                      fontWeight: 500,
                                      cursor: "pointer",
                                      transition: "all var(--duration-fast)",
                                      whiteSpace: "nowrap",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background =
                                        "var(--color-destructive)";
                                      e.currentTarget.style.color =
                                        "var(--color-text-inverse)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background =
                                        "var(--color-destructive-muted)";
                                      e.currentTarget.style.color =
                                        "var(--color-destructive)";
                                    }}
                                  >
                                    <X size={12} strokeWidth={2.5} />
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                /* Inline reject form */
                                <RejectForm
                                  onConfirm={(note) =>
                                    handleReject(req, note)
                                  }
                                  onCancel={() => setRejectingId(null)}
                                />
                              )}
                            </div>
                          ) : (
                            <span
                              style={{
                                fontSize: "var(--text-xs)",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              {req.fulfilledAt
                                ? format(
                                    parseISO(req.fulfilledAt),
                                    "d MMM yyyy"
                                  )
                                : "—"}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend note for staff */}
        {!canAction && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            <AlertCircle size={14} />
            You have read-only access. Only admins and team leads can approve or
            reject requests.
          </div>
        )}
      </div>
    </>
  );
}
