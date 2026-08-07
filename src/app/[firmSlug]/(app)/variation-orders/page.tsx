"use client";
/**
 * Variation Orders — firm-wide VO list.
 * Filter tabs: All | Draft | Pending Client | Approved | Rejected
 * Lifecycle: Draft → Pending Client → Approved / Rejected
 * Actions (admin/lead): Send to Client, Client Approved, Client Rejected
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Send,
  ChevronRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useVoStore } from "@/lib/store/vo.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { toast } from "@/lib/store/toast.store";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { VariationOrder, VOStatus } from "@/lib/store/types";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr 160px 100px 110px 160px 120px 120px",
        gap: 12,
        alignItems: "center",
        padding: "14px 20px",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {[140, 240, 120, 72, 80, 140, 88, 88].map((w, i) => (
        <div
          key={i}
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
      ))}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div
      style={{
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Title */}
      <div
        style={{
          width: 220,
          height: 32,
          borderRadius: "var(--radius-md)",
          background: "var(--color-bg-card)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, transparent 0%, var(--color-bg-card-hover) 50%, transparent 100%)",
            animation: "shimmer 1.5s infinite",
          }}
        />
      </div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        {[80, 72, 120, 88, 80].map((w, i) => (
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
      {/* Table */}
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Reject Note Modal ────────────────────────────────────────────────────────

function RejectNoteModal({
  voNumber,
  onConfirm,
  onCancel,
}: {
  voNumber: string;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: 28,
          width: 440,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "var(--text-base)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            Client Rejected {voNumber}
          </h2>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "var(--text-sm)",
              color: "var(--color-text-muted)",
            }}
          >
            Provide a rejection note to record the client's reason.
          </p>
        </div>

        <textarea
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Client does not agree with the fee increase…"
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

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              background: "transparent",
              color: "var(--color-text-secondary)",
              fontSize: "var(--text-sm)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--color-bg-input)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!note.trim()) return;
              onConfirm(note.trim());
            }}
            disabled={!note.trim()}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: note.trim()
                ? "var(--color-destructive)"
                : "var(--color-bg-input)",
              color: note.trim()
                ? "white"
                : "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              cursor: note.trim() ? "pointer" : "not-allowed",
              transition: "all var(--duration-fast)",
            }}
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Lifecycle Indicator ───────────────────────────────────────────────

function LifecycleIndicator({ status }: { status: VOStatus }) {
  const steps: { key: VOStatus | "end"; label: string }[] = [
    { key: "draft", label: "Draft" },
    { key: "pending_client", label: "Pending" },
    { key: "approved", label: "Approved" },
  ];

  const isRejected = status === "rejected";

  const stepIndex = (s: VOStatus): number => {
    if (s === "draft") return 0;
    if (s === "pending_client") return 1;
    if (s === "approved") return 2;
    return 1; // rejected stays at pending visually
  };

  const currentIdx = stepIndex(status);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {steps.map((step, i) => {
        const isCompleted = !isRejected && i < currentIdx;
        const isCurrent =
          (!isRejected && i === currentIdx) ||
          (isRejected && i === 1);
        const isDone = !isRejected && i <= currentIdx;

        const dotColor = isRejected && isCurrent
          ? "var(--color-destructive)"
          : isDone
          ? "var(--color-success)"
          : "var(--color-bg-input)";

        const dotBorder = isRejected && isCurrent
          ? "2px solid var(--color-destructive)"
          : isDone
          ? "2px solid var(--color-success)"
          : "2px solid var(--color-border)";

        return (
          <div
            key={step.key}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: dotColor,
                border: dotBorder,
                flexShrink: 0,
                transition: "all var(--duration-fast)",
              }}
            />
            {i < steps.length - 1 && (
              <div
                style={{
                  width: 16,
                  height: 1.5,
                  background: isCompleted
                    ? "var(--color-success)"
                    : "var(--color-border)",
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── VO Table Row ─────────────────────────────────────────────────────────────

interface VORowProps {
  vo: VariationOrder;
  projectName: string | undefined;
  projectId: string;
  canAct: boolean;
  onSendToClient: () => void;
  onClientApprove: () => void;
  onClientReject: () => void;
  onNavigateToProject: () => void;
}

function VORow({
  vo,
  projectName,
  canAct,
  onSendToClient,
  onClientApprove,
  onClientReject,
  onNavigateToProject,
}: VORowProps) {
  const isApproved = vo.status === "approved";
  const isRejected = vo.status === "rejected";
  const isDraft = vo.status === "draft";
  const isPending = vo.status === "pending_client";

  const hasTimelineImpact = vo.timelineImpactDays !== 0;
  const hasFeeImpact = vo.feeImpactAmount !== 0;

  const feeFormatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(vo.feeImpactAmount));

  const feeDisplay =
    vo.feeImpactAmount > 0
      ? `+${feeFormatted}`
      : vo.feeImpactAmount < 0
      ? `−${feeFormatted}`
      : "₹0";

  const timelineDisplay =
    vo.timelineImpactDays > 0
      ? `+${vo.timelineImpactDays} days`
      : vo.timelineImpactDays < 0
      ? `${vo.timelineImpactDays} days`
      : "0 days";

  return (
    <tr
      style={{
        borderBottom: "1px solid var(--color-border)",
        borderLeft: isApproved
          ? "3px solid var(--color-success)"
          : "3px solid transparent",
        opacity: isRejected ? 0.7 : 1,
        transition: "background var(--duration-fast)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--color-bg-card-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "transparent")
      }
    >
      {/* VO Number */}
      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            letterSpacing: "0.04em",
          }}
        >
          {vo.voNumber}
        </span>
      </td>

      {/* Title + description */}
      <td style={{ padding: "14px 16px", maxWidth: 300 }}>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            color: "var(--color-text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {vo.title}
        </p>
        {vo.description && (
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 260,
            }}
          >
            {vo.description}
          </p>
        )}
      </td>

      {/* Project chip */}
      <td style={{ padding: "14px 16px" }}>
        {projectName ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToProject();
            }}
            style={{
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
              display: "block",
              transition: "color var(--duration-fast)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--color-accent)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--color-text-secondary)")
            }
          >
            {projectName}
          </button>
        ) : (
          <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
            —
          </span>
        )}
      </td>

      {/* Timeline impact chip */}
      <td style={{ padding: "14px 16px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: "var(--text-xs)",
            fontWeight: 500,
            padding: "2px 8px",
            borderRadius: "var(--radius-sm)",
            color: hasTimelineImpact
              ? "var(--color-warning)"
              : "var(--color-text-muted)",
            background: hasTimelineImpact
              ? "var(--color-warning-muted)"
              : "rgb(107 107 112 / 0.10)",
            whiteSpace: "nowrap",
          }}
        >
          {hasTimelineImpact && <Clock size={10} strokeWidth={2} />}
          {timelineDisplay}
        </span>
      </td>

      {/* Fee impact chip */}
      <td style={{ padding: "14px 16px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            fontSize: "var(--text-xs)",
            fontWeight: 500,
            padding: "2px 8px",
            borderRadius: "var(--radius-sm)",
            color: hasFeeImpact
              ? "var(--color-accent)"
              : "var(--color-text-muted)",
            background: hasFeeImpact
              ? "var(--color-accent-muted)"
              : "rgb(107 107 112 / 0.10)",
            whiteSpace: "nowrap",
          }}
        >
          {feeDisplay}
        </span>
      </td>

      {/* Status + lifecycle */}
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <StatusBadge
            status={
              vo.status === "draft"
                ? "draft_vo"
                : vo.status === "pending_client"
                ? "pending_client"
                : vo.status === "approved"
                ? "vo_approved"
                : "vo_rejected"
            }
            size="sm"
          />
          <LifecycleIndicator status={vo.status} />
        </div>
      </td>

      {/* Client approval status */}
      <td style={{ padding: "14px 16px" }}>
        {isPending && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: "var(--text-xs)",
              fontWeight: 500,
              color: "var(--color-warning)",
              background: "var(--color-warning-muted)",
              padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              whiteSpace: "nowrap",
            }}
          >
            <AlertCircle size={10} strokeWidth={2} />
            Awaiting client
          </span>
        )}
        {isApproved && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: "var(--text-xs)",
              fontWeight: 500,
              color: "var(--color-success)",
              background: "var(--color-success-muted)",
              padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              whiteSpace: "nowrap",
            }}
          >
            <CheckCircle2 size={10} strokeWidth={2} />
            Client approved
          </span>
        )}
        {isRejected && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: "var(--text-xs)",
              fontWeight: 500,
              color: "var(--color-destructive)",
              background: "var(--color-destructive-muted)",
              padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              whiteSpace: "nowrap",
            }}
          >
            <XCircle size={10} strokeWidth={2} />
            Client rejected
          </span>
        )}
        {isDraft && (
          <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
            —
          </span>
        )}
      </td>

      {/* Date raised */}
      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {format(parseISO(vo.createdAt), "d MMM yyyy")}
        </span>
      </td>

      {/* Actions */}
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {canAct && isDraft && (
            <ActionButton
              label="Send to Client"
              icon={<Send size={11} strokeWidth={2} />}
              color="var(--color-accent)"
              bgColor="var(--color-accent-muted)"
              onClick={(e) => {
                e.stopPropagation();
                onSendToClient();
              }}
            />
          )}
          {canAct && isPending && (
            <>
              <ActionButton
                label="Approved"
                icon={<CheckCircle2 size={11} strokeWidth={2} />}
                color="var(--color-success)"
                bgColor="var(--color-success-muted)"
                onClick={(e) => {
                  e.stopPropagation();
                  onClientApprove();
                }}
              />
              <ActionButton
                label="Rejected"
                icon={<XCircle size={11} strokeWidth={2} />}
                color="var(--color-destructive)"
                bgColor="var(--color-destructive-muted)"
                onClick={(e) => {
                  e.stopPropagation();
                  onClientReject();
                }}
              />
            </>
          )}
          {isApproved && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: "var(--text-xs)",
                fontWeight: 500,
                color: "var(--color-success)",
              }}
            >
              <CheckCircle2 size={12} strokeWidth={2} />
              Approved
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Action Button ─────────────────────────────────────────────────────────────

function ActionButton({
  label,
  icon,
  color,
  bgColor,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 9px",
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${color}`,
        background: bgColor,
        color,
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "opacity var(--duration-fast)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Filter Tab ───────────────────────────────────────────────────────────────

function FilterTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 14px",
        borderRadius: "var(--radius-sm)",
        border: active
          ? "1px solid var(--color-accent)"
          : "1px solid var(--color-border)",
        background: active ? "var(--color-accent-muted)" : "transparent",
        color: active ? "var(--color-accent)" : "var(--color-text-muted)",
        fontSize: "var(--text-sm)",
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        transition: "all var(--duration-fast)",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--color-bg-card-hover)";
          e.currentTarget.style.color = "var(--color-text-secondary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--color-text-muted)";
        }
      }}
    >
      {label}
      <span
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          padding: "1px 6px",
          borderRadius: 10,
          background: active ? "var(--color-accent)" : "var(--color-bg-input)",
          color: active ? "white" : "var(--color-text-muted)",
          minWidth: 20,
          textAlign: "center",
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type TabFilter = "all" | VOStatus;

const TABS: { value: TabFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "pending_client", label: "Pending Client" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VariationOrdersPage() {
  const params = useParams<{ firmSlug: string }>();
  const router = useRouter();
  const { user, firm } = useAuthStore();
  const { variationOrders, sendToClient, clientApprove, clientReject } =
    useVoStore();
  const { projects } = useProjectStore();

  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [rejectTarget, setRejectTarget] = useState<VariationOrder | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const canAct =
    user?.role === "admin" || user?.role === "team_lead";

  const firmVOs = useMemo(() => {
    if (!firm) return [];
    return variationOrders
      .filter((v) => v.firmId === firm.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [variationOrders, firm]);

  const counts = useMemo(
    () => ({
      all: firmVOs.length,
      draft: firmVOs.filter((v) => v.status === "draft").length,
      pending_client: firmVOs.filter((v) => v.status === "pending_client")
        .length,
      approved: firmVOs.filter((v) => v.status === "approved").length,
      rejected: firmVOs.filter((v) => v.status === "rejected").length,
    }),
    [firmVOs]
  );

  const filtered = useMemo(() => {
    if (activeTab === "all") return firmVOs;
    return firmVOs.filter((v) => v.status === activeTab);
  }, [firmVOs, activeTab]);

  const getProject = (projectId: string) =>
    projects.find((p) => p.id === projectId);

  const handleSendToClient = (vo: VariationOrder) => {
    sendToClient(vo.id);
    toast(`${vo.voNumber} sent for client approval`, "success");
  };

  const handleClientApprove = (vo: VariationOrder) => {
    clientApprove(vo.id);
    toast(`${vo.voNumber} marked as client approved`, "success");
  };

  const handleClientReject = (vo: VariationOrder, note: string) => {
    clientReject(vo.id, note);
    setRejectTarget(null);
    toast(`${vo.voNumber} marked as client rejected`, "default");
  };

  if (!user || !firm) return null;

  if (!ready) {
    return (
      <>
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
        <PageSkeleton />
      </>
    );
  }

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
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "var(--text-xl)",
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                color: "var(--color-text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Variation Orders
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-muted)",
              }}
            >
              {firm.name} · {counts.all} variation order
              {counts.all !== 1 ? "s" : ""}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {counts.pending_client > 0 && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-warning-muted)",
                  border: "1px solid var(--color-warning)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  color: "var(--color-warning)",
                }}
              >
                <AlertCircle size={13} strokeWidth={2} />
                {counts.pending_client} awaiting client
              </div>
            )}
          </div>
        </div>

        {/* ── Filter Tabs ── */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TABS.map((tab) => (
            <FilterTab
              key={tab.value}
              label={tab.label}
              count={counts[tab.value]}
              active={activeTab === tab.value}
              onClick={() => setActiveTab(tab.value)}
            />
          ))}
        </div>

        {/* ── Table or Empty State ── */}
        {filtered.length === 0 ? (
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
            }}
          >
            <FileText
              size={44}
              strokeWidth={1}
              style={{ color: "var(--color-text-muted)", opacity: 0.5 }}
            />
            <p
              style={{
                margin: 0,
                fontSize: "var(--text-base)",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
              }}
            >
              No variation orders yet
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "var(--text-sm)",
                color: "var(--color-text-muted)",
              }}
            >
              {activeTab === "all"
                ? "Variation orders will appear here once created from a project."
                : `No variation orders with status "${activeTab.replace("_", " ")}".`}
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
                  {[
                    "VO #",
                    "Title",
                    "Project",
                    "Timeline",
                    "Fee Impact",
                    "Status",
                    "Client",
                    "Raised",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        fontSize: "var(--text-xs)",
                        fontWeight: 500,
                        color: "var(--color-text-muted)",
                        whiteSpace: "nowrap",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((vo) => {
                  const project = getProject(vo.projectId);
                  return (
                    <VORow
                      key={vo.id}
                      vo={vo}
                      projectName={project?.name}
                      projectId={vo.projectId}
                      canAct={canAct}
                      onSendToClient={() => handleSendToClient(vo)}
                      onClientApprove={() => handleClientApprove(vo)}
                      onClientReject={() => setRejectTarget(vo)}
                      onNavigateToProject={() =>
                        router.push(
                          `/${params.firmSlug}/projects/${vo.projectId}`
                        )
                      }
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Reject Note Modal ── */}
      {rejectTarget && (
        <RejectNoteModal
          voNumber={rejectTarget.voNumber}
          onConfirm={(note) => handleClientReject(rejectTarget, note)}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </>
  );
}
