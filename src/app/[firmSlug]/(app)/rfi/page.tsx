"use client";
/**
 * RFI Page — firm-wide list of all RFIs across all projects.
 * Filter tabs: All | Open | Responded | Closed (with counts).
 * Priority filter, project filter, search bar.
 * Inline respond form below the row when "Respond" is clicked.
 * Unresponded RFIs older than 3 days → subtle red left border + warning icon.
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO, isPast, differenceInDays } from "date-fns";
import {
  Search,
  MessageSquare,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Send,
} from "lucide-react";
import { useRfiStore } from "@/lib/store/rfi.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "@/lib/store/toast.store";
import type { RFI, Priority } from "@/lib/store/types";

/* ─── Constants ──────────────────────────────────────────────────────────── */

type TabFilter = "all" | "open" | "responded" | "closed";

const PRIORITY_DOT: Record<Priority, string> = {
  urgent: "var(--color-destructive)",
  high: "var(--color-accent)",
  medium: "var(--color-warning)",
  low: "var(--color-text-muted)",
};

const PRIORITY_OPTIONS: { value: "all" | Priority; label: string }[] = [
  { value: "all", label: "All Priority" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const RAISER_TYPE_LABEL: Record<RFI["raiserType"], string> = {
  contractor: "Contractor",
  client: "Client",
};

const RAISER_TYPE_COLOR: Record<RFI["raiserType"], string> = {
  contractor: "var(--color-accent)",
  client: "var(--color-info, #60a5fa)",
};

const RAISER_TYPE_BG: Record<RFI["raiserType"], string> = {
  contractor: "var(--color-accent-muted)",
  client: "var(--color-info-muted, rgba(96,165,250,0.12))",
};

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function isOldOpen(rfi: RFI): boolean {
  if (rfi.status !== "open") return false;
  return differenceInDays(new Date(), parseISO(rfi.createdAt)) >= 3;
}

function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM yyyy");
  } catch {
    return iso;
  }
}

function isDateOverdue(iso: string): boolean {
  try {
    return isPast(parseISO(iso));
  } catch {
    return false;
  }
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

interface RespondFormProps {
  rfi: RFI;
  userId: string;
  onClose: () => void;
}

function RespondForm({ rfi, userId, onClose }: RespondFormProps) {
  const { respond } = useRfiStore();
  const [text, setText] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"responded" | "closed">(
    "responded"
  );
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!text.trim()) {
      toast("Please enter a response before submitting.", "error");
      return;
    }
    setSubmitting(true);
    respond(rfi.id, {
      respondedById: userId,
      responseText: text.trim(),
      status: submitStatus,
    });
    toast(
      submitStatus === "closed"
        ? `${rfi.rfiNumber} responded and closed.`
        : `${rfi.rfiNumber} marked as responded.`,
      "success"
    );
    onClose();
  };

  return (
    <div
      style={{
        padding: "16px 20px 16px 48px",
        background: "var(--color-bg-canvas)",
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 680,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Response to {rfi.rfiNumber}
        </p>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your response here…"
          rows={4}
          style={{
            background: "var(--color-bg-input)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-text-primary)",
            fontSize: "var(--text-sm)",
            padding: "10px 12px",
            resize: "vertical",
            outline: "none",
            lineHeight: 1.6,
            fontFamily: "inherit",
            width: "100%",
            boxSizing: "border-box",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--color-accent)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--color-border)")
          }
        />

        {/* Status toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              marginRight: 4,
            }}
          >
            Mark as:
          </span>
          {(["responded", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSubmitStatus(s)}
              style={{
                padding: "5px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--text-xs)",
                fontWeight: 500,
                cursor: "pointer",
                border:
                  submitStatus === s
                    ? `1.5px solid ${
                        s === "closed"
                          ? "var(--color-text-muted)"
                          : "var(--color-success)"
                      }`
                    : "1px solid var(--color-border)",
                background:
                  submitStatus === s
                    ? s === "closed"
                      ? "rgb(107 107 112 / 0.12)"
                      : "var(--color-success-muted)"
                    : "var(--color-bg-input)",
                color:
                  submitStatus === s
                    ? s === "closed"
                      ? "var(--color-text-muted)"
                      : "var(--color-success)"
                    : "var(--color-text-secondary)",
                transition: "all var(--duration-fast)",
              }}
            >
              {s === "responded" ? "Responded" : "Respond & Close"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              background: "var(--color-accent)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
              transition: "opacity var(--duration-fast)",
            }}
          >
            <Send size={13} />
            Submit Response
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "7px 14px",
              background: "transparent",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--text-sm)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <tr
      style={{
        borderBottom: "1px solid var(--color-border)",
        animation: "pulse 1.6s ease-in-out infinite",
      }}
    >
      {[28, 280, 140, 120, 100, 90, 120].map((w, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div
            style={{
              height: 14,
              width: w,
              background: "var(--color-bg-card)",
              borderRadius: "var(--radius-sm)",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function RFIPage() {
  const params = useParams<{ firmSlug: string }>();
  const router = useRouter();
  const { rfis, respond, close, setPriority } = useRfiStore();
  const { projects } = useProjectStore();
  const { user, firm } = useAuthStore();

  /* UI state */
  const [loading, setLoading] = useState(true);
  const [tabFilter, setTabFilter] = useState<TabFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedRfiId, setExpandedRfiId] = useState<string | null>(null);
  const [priorityDropdownId, setPriorityDropdownId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  /* Derived data */
  const firmProjects = useMemo(
    () => projects.filter((p) => p.firmId === firm?.id),
    [projects, firm]
  );

  const firmRfis = useMemo(() => {
    if (!firm) return [];
    return rfis.filter((r) => r.firmId === firm.id);
  }, [rfis, firm]);

  /* Tab counts */
  const tabCounts = useMemo(
    () => ({
      all: firmRfis.length,
      open: firmRfis.filter((r) => r.status === "open").length,
      responded: firmRfis.filter((r) => r.status === "responded").length,
      closed: firmRfis.filter((r) => r.status === "closed").length,
    }),
    [firmRfis]
  );

  const filteredRfis = useMemo(() => {
    let result = [...firmRfis];

    if (tabFilter !== "all") {
      result = result.filter((r) => r.status === tabFilter);
    }
    if (priorityFilter !== "all") {
      result = result.filter((r) => r.priority === priorityFilter);
    }
    if (projectFilter !== "all") {
      result = result.filter((r) => r.projectId === projectFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.rfiNumber.toLowerCase().includes(q) ||
          r.raiserName.toLowerCase().includes(q)
      );
    }

    // Sort: open first, then by createdAt desc
    return result.sort((a, b) => {
      const statusOrder = { open: 0, responded: 1, closed: 2 };
      const so = statusOrder[a.status] - statusOrder[b.status];
      if (so !== 0) return so;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [firmRfis, tabFilter, priorityFilter, projectFilter, search]);

  const getProject = (projectId: string) =>
    firmProjects.find((p) => p.id === projectId);

  const handleClose = (rfi: RFI) => {
    if (!user) return;
    close(rfi.id, user.id);
    toast(`${rfi.rfiNumber} has been closed.`, "success");
  };

  const handleSetPriority = (rfi: RFI, priority: Priority) => {
    setPriority(rfi.id, priority);
    setPriorityDropdownId(null);
    toast(`${rfi.rfiNumber} priority set to ${priority}.`, "default");
  };

  /* Shared select style */
  const selectStyle: React.CSSProperties = {
    background: "var(--color-bg-input)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--color-text-primary)",
    fontSize: "var(--text-sm)",
    padding: "7px 12px",
    outline: "none",
    cursor: "pointer",
  };

  /* Tab button */
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 16px",
    border: "none",
    borderBottom: active
      ? "2px solid var(--color-accent)"
      : "2px solid transparent",
    background: "transparent",
    color: active ? "var(--color-accent)" : "var(--color-text-muted)",
    fontSize: "var(--text-sm)",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    transition: "color var(--duration-fast)",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    whiteSpace: "nowrap",
  });

  /* ─── Skeleton Loader ─────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
        {/* Title skeleton */}
        <div
          style={{
            width: 80,
            height: 28,
            background: "var(--color-bg-card)",
            borderRadius: "var(--radius-md)",
            animation: "pulse 1.6s ease-in-out infinite",
          }}
        />
        {/* Tab bar skeleton */}
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--color-border)", paddingBottom: 0 }}>
          {[80, 60, 100, 80].map((w, i) => (
            <div
              key={i}
              style={{
                width: w,
                height: 32,
                background: "var(--color-bg-card)",
                borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
                animation: "pulse 1.6s ease-in-out infinite",
                animationDelay: `${i * 0.08}s`,
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

  /* ─── Render ──────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
      `}</style>

      <div
        style={{
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 0,
          background: "var(--color-bg-canvas)",
          minHeight: "100%",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "var(--text-xl)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            RFIs
          </h1>
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
            {filteredRfis.length}{" "}
            {filteredRfis.length === 1 ? "RFI" : "RFIs"}
          </span>
        </div>

        {/* ── Filter Tabs ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            borderBottom: "1px solid var(--color-border)",
            marginBottom: 16,
            gap: 0,
          }}
        >
          {(
            [
              { key: "all", label: "All" },
              { key: "open", label: "Open" },
              { key: "responded", label: "Responded" },
              { key: "closed", label: "Closed" },
            ] as { key: TabFilter; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTabFilter(key)}
              style={tabStyle(tabFilter === key)}
            >
              {label}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 18,
                  height: 18,
                  padding: "0 5px",
                  borderRadius: 999,
                  background:
                    tabFilter === key
                      ? "var(--color-accent-muted)"
                      : "var(--color-bg-card)",
                  color:
                    tabFilter === key
                      ? "var(--color-accent)"
                      : "var(--color-text-muted)",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {tabCounts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Filter Bar ── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search RFIs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                ...selectStyle,
                paddingLeft: 32,
                width: 220,
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-accent)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-border)")
              }
            />
          </div>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value as typeof priorityFilter)
            }
            style={selectStyle}
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Project */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            style={{ ...selectStyle, maxWidth: 220 }}
          >
            <option value="all">All Projects</option>
            {firmProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* ── Table ── */}
        {filteredRfis.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "72px 24px",
              gap: 12,
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-muted)",
            }}
          >
            <MessageSquare size={44} strokeWidth={1} opacity={0.35} />
            <p
              style={{
                margin: 0,
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                fontSize: "var(--text-base)",
              }}
            >
              {tabFilter === "open"
                ? "No open RFIs — all queries have been addressed"
                : "No RFIs match your filters"}
            </p>
            <p
              style={{ margin: 0, fontSize: "var(--text-xs)", textAlign: "center" }}
            >
              {tabFilter === "open"
                ? "New RFIs from contractors or clients will appear here."
                : "Try adjusting your filters or search term."}
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
                  {/* Priority dot col */}
                  <th style={{ width: 28, padding: "10px 0 10px 16px" }} />
                  <th
                    style={{
                      padding: "10px 16px",
                      fontSize: "var(--text-xs)",
                      fontWeight: 500,
                      color: "var(--color-text-muted)",
                      minWidth: 260,
                    }}
                  >
                    RFI
                  </th>
                  <th
                    style={{
                      padding: "10px 16px",
                      fontSize: "var(--text-xs)",
                      fontWeight: 500,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Project
                  </th>
                  <th
                    style={{
                      padding: "10px 16px",
                      fontSize: "var(--text-xs)",
                      fontWeight: 500,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "10px 16px",
                      fontSize: "var(--text-xs)",
                      fontWeight: 500,
                      color: "var(--color-text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Response Due
                  </th>
                  <th
                    style={{
                      padding: "10px 16px",
                      fontSize: "var(--text-xs)",
                      fontWeight: 500,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRfis.map((rfi) => {
                  const project = getProject(rfi.projectId);
                  const old = isOldOpen(rfi);
                  const dueDateOverdue =
                    rfi.responseRequiredBy &&
                    rfi.status === "open" &&
                    isDateOverdue(rfi.responseRequiredBy);
                  const isExpanded = expandedRfiId === rfi.id;
                  const showPriorityMenu = priorityDropdownId === rfi.id;

                  return (
                    <>
                      <tr
                        key={rfi.id}
                        style={{
                          borderBottom: isExpanded
                            ? "none"
                            : "1px solid var(--color-border)",
                          borderLeft: old
                            ? "3px solid var(--color-destructive)"
                            : "3px solid transparent",
                          transition: "background var(--duration-fast)",
                          cursor: "default",
                          position: "relative",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--color-bg-card-hover)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {/* Priority dot (clickable to change priority) */}
                        <td
                          style={{
                            padding: "14px 0 14px 16px",
                            width: 28,
                            verticalAlign: "top",
                          }}
                        >
                          <div style={{ position: "relative" }}>
                            <button
                              title={`Priority: ${rfi.priority}. Click to change.`}
                              onClick={() =>
                                setPriorityDropdownId(
                                  showPriorityMenu ? null : rfi.id
                                )
                              }
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                background: PRIORITY_DOT[rfi.priority],
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                display: "block",
                                marginTop: 3,
                              }}
                            />
                            {showPriorityMenu && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: 18,
                                  left: 0,
                                  zIndex: 100,
                                  background: "var(--color-bg-card)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: "var(--radius-md)",
                                  boxShadow:
                                    "0 8px 24px rgba(0,0,0,0.28)",
                                  minWidth: 130,
                                  overflow: "hidden",
                                }}
                              >
                                {(
                                  [
                                    "urgent",
                                    "high",
                                    "medium",
                                    "low",
                                  ] as Priority[]
                                ).map((p) => (
                                  <button
                                    key={p}
                                    onClick={() =>
                                      handleSetPriority(rfi, p)
                                    }
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      width: "100%",
                                      padding: "8px 12px",
                                      background:
                                        rfi.priority === p
                                          ? "var(--color-bg-card-hover)"
                                          : "transparent",
                                      border: "none",
                                      color: "var(--color-text-primary)",
                                      fontSize: "var(--text-sm)",
                                      cursor: "pointer",
                                      textAlign: "left",
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.background =
                                        "var(--color-bg-card-hover)")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.background =
                                        rfi.priority === p
                                          ? "var(--color-bg-card-hover)"
                                          : "transparent")
                                    }
                                  >
                                    <span
                                      style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: PRIORITY_DOT[p],
                                        flexShrink: 0,
                                      }}
                                    />
                                    <span style={{ textTransform: "capitalize" }}>
                                      {p}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* RFI info */}
                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "var(--text-xs)",
                                  fontWeight: 600,
                                  color: "var(--color-text-muted)",
                                  letterSpacing: "0.04em",
                                  fontFamily: "monospace",
                                }}
                              >
                                {rfi.rfiNumber}
                              </span>
                              {/* Raiser type badge */}
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "1px 7px",
                                  borderRadius: "var(--radius-sm)",
                                  fontSize: 10,
                                  fontWeight: 600,
                                  background:
                                    RAISER_TYPE_BG[rfi.raiserType],
                                  color: RAISER_TYPE_COLOR[rfi.raiserType],
                                  letterSpacing: "0.03em",
                                }}
                              >
                                {RAISER_TYPE_LABEL[rfi.raiserType]}
                              </span>
                              {/* Old open warning */}
                              {old && (
                                <span
                                  title="Open for more than 3 days"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                    color: "var(--color-destructive)",
                                    fontSize: 10,
                                    fontWeight: 500,
                                  }}
                                >
                                  <AlertTriangle size={11} />
                                  Stale
                                </span>
                              )}
                            </div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "var(--text-sm)",
                                fontWeight: 500,
                                color: "var(--color-text-primary)",
                                lineHeight: 1.4,
                              }}
                            >
                              {rfi.title}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "var(--text-xs)",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              Raised by {rfi.raiserName} ·{" "}
                              {formatDate(rfi.createdAt)}
                            </p>
                            {rfi.linkedDrawingNumber && (
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "var(--text-xs)",
                                  color: "var(--color-text-muted)",
                                }}
                              >
                                Drawing: {rfi.linkedDrawingNumber}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Project chip */}
                        <td
                          style={{
                            padding: "14px 16px",
                            verticalAlign: "top",
                          }}
                        >
                          {project ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/${params.firmSlug}/projects/${project.id}`
                                );
                              }}
                              style={{
                                background: "var(--color-bg-input)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-sm)",
                                color: "var(--color-text-secondary)",
                                fontSize: "var(--text-xs)",
                                padding: "3px 9px",
                                cursor: "pointer",
                                maxWidth: 160,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "block",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.color =
                                  "var(--color-accent)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color =
                                  "var(--color-text-secondary)")
                              }
                              title={project.name}
                            >
                              {project.name}
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

                        {/* Status */}
                        <td
                          style={{
                            padding: "14px 16px",
                            verticalAlign: "top",
                          }}
                        >
                          <StatusBadge status={rfi.status} size="sm" />
                        </td>

                        {/* Response due date */}
                        <td
                          style={{
                            padding: "14px 16px",
                            verticalAlign: "top",
                          }}
                        >
                          {rfi.responseRequiredBy ? (
                            <span
                              style={{
                                fontSize: "var(--text-sm)",
                                fontWeight: dueDateOverdue ? 600 : 400,
                                color: dueDateOverdue
                                  ? "var(--color-destructive)"
                                  : "var(--color-text-muted)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              {dueDateOverdue && <Clock size={12} />}
                              {formatDate(rfi.responseRequiredBy)}
                              {dueDateOverdue && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 500,
                                  }}
                                >
                                  Overdue
                                </span>
                              )}
                            </span>
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

                        {/* Actions */}
                        <td
                          style={{
                            padding: "14px 16px",
                            verticalAlign: "top",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            {/* Respond button — only for open */}
                            {rfi.status === "open" && (
                              <button
                                onClick={() =>
                                  setExpandedRfiId(
                                    isExpanded ? null : rfi.id
                                  )
                                }
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  padding: "5px 12px",
                                  background: isExpanded
                                    ? "var(--color-accent-muted)"
                                    : "var(--color-accent)",
                                  color: isExpanded
                                    ? "var(--color-accent)"
                                    : "#fff",
                                  border: isExpanded
                                    ? "1px solid var(--color-accent)"
                                    : "none",
                                  borderRadius: "var(--radius-sm)",
                                  fontSize: "var(--text-xs)",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  transition:
                                    "all var(--duration-fast)",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <Send size={11} />
                                {isExpanded ? "Cancel" : "Respond"}
                              </button>
                            )}

                            {/* Close button — for responded */}
                            {rfi.status === "responded" && (
                              <button
                                onClick={() => handleClose(rfi)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  padding: "5px 12px",
                                  background: "transparent",
                                  color: "var(--color-text-muted)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: "var(--radius-sm)",
                                  fontSize: "var(--text-xs)",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  transition:
                                    "all var(--duration-fast)",
                                  whiteSpace: "nowrap",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor =
                                    "var(--color-text-muted)";
                                  e.currentTarget.style.color =
                                    "var(--color-text-primary)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor =
                                    "var(--color-border)";
                                  e.currentTarget.style.color =
                                    "var(--color-text-muted)";
                                }}
                              >
                                <XCircle size={11} />
                                Close
                              </button>
                            )}

                            {/* Closed indicator */}
                            {rfi.status === "closed" && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  fontSize: "var(--text-xs)",
                                  color: "var(--color-text-muted)",
                                }}
                              >
                                <CheckCircle size={12} />
                                {rfi.closedAt
                                  ? formatDate(rfi.closedAt)
                                  : "Closed"}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Inline response form */}
                      {isExpanded && user && (
                        <tr
                          key={`${rfi.id}-form`}
                          style={{
                            borderBottom: "1px solid var(--color-border)",
                          }}
                        >
                          <td
                            colSpan={6}
                            style={{ padding: 0 }}
                          >
                            <RespondForm
                              rfi={rfi}
                              userId={user.id}
                              onClose={() => setExpandedRfiId(null)}
                            />
                          </td>
                        </tr>
                      )}

                      {/* Previous response display (for responded/closed) */}
                      {(rfi.status === "responded" ||
                        rfi.status === "closed") &&
                        rfi.responseText && (
                          <tr
                            key={`${rfi.id}-response`}
                            style={{
                              borderBottom: "1px solid var(--color-border)",
                              background: "var(--color-bg-canvas)",
                            }}
                          >
                            <td colSpan={6} style={{ padding: 0 }}>
                              <div
                                style={{
                                  padding:
                                    "10px 20px 10px 48px",
                                  display: "flex",
                                  gap: 8,
                                  alignItems: "flex-start",
                                }}
                              >
                                <CheckCircle
                                  size={13}
                                  style={{
                                    marginTop: 2,
                                    flexShrink: 0,
                                    color: "var(--color-success)",
                                  }}
                                />
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 2,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "var(--text-xs)",
                                      color: "var(--color-text-muted)",
                                    }}
                                  >
                                    Response
                                    {rfi.respondedAt
                                      ? ` · ${formatDate(rfi.respondedAt)}`
                                      : ""}
                                  </span>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: "var(--text-sm)",
                                      color: "var(--color-text-secondary)",
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {rfi.responseText}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
