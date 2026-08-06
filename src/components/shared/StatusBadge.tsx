/**
 * StatusBadge — renders any status/type in the system through a single component.
 * Colors are muted, desaturated fills (12% opacity). No loud greens or reds.
 * Uses CSS custom properties from tokens.css.
 */

type StatusVariant =
  // Task
  | "todo" | "in_progress" | "review" | "approved" | "done" | "blocked"
  // Approval
  | "pending" | "revision_requested" | "rejected"
  // Project
  | "active" | "on_hold" | "completed" | "cancelled"
  // File
  | "informational" | "final" | "contractor_view" | "superseded"
  // Leave
  | "leave_pending" | "leave_approved" | "leave_rejected"
  // Invoice
  | "draft" | "sent" | "partially_paid" | "paid" | "overdue"
  // RFI
  | "open" | "responded" | "closed"
  // Punch list
  | "resolved_by_contractor" | "confirmed_by_architect"
  // Priority
  | "low" | "medium" | "high" | "urgent"
  // VO
  | "draft_vo" | "pending_client" | "vo_approved" | "vo_rejected"
  // CRM Lead
  | "new" | "contacted" | "proposal_sent" | "negotiation" | "won" | "lost"
  // Generic
  | string;

interface StatusConfig {
  label: string;
  color: string;          // CSS custom property token
  bg: string;             // CSS custom property token
  dot?: boolean;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  // Task statuses
  todo:                   { label: "To Do",           color: "var(--color-text-muted)",     bg: "rgb(107 107 112 / 0.12)" },
  in_progress:            { label: "In Progress",     color: "var(--color-info)",            bg: "var(--color-info-muted)" },
  review:                 { label: "Review",           color: "var(--color-warning)",         bg: "var(--color-warning-muted)" },
  approved:               { label: "Approved",         color: "var(--color-success)",         bg: "var(--color-success-muted)" },
  done:                   { label: "Done",             color: "var(--color-success)",         bg: "var(--color-success-muted)" },
  blocked:                { label: "Blocked",          color: "var(--color-destructive)",     bg: "var(--color-destructive-muted)" },

  // Approval
  pending:                { label: "Pending",          color: "var(--color-warning)",         bg: "var(--color-warning-muted)" },
  revision_requested:     { label: "Revision",         color: "var(--color-warning)",         bg: "var(--color-warning-muted)" },
  rejected:               { label: "Rejected",         color: "var(--color-destructive)",     bg: "var(--color-destructive-muted)" },

  // Project
  active:                 { label: "Active",           color: "var(--color-success)",         bg: "var(--color-success-muted)" },
  on_hold:                { label: "On Hold",          color: "var(--color-warning)",         bg: "var(--color-warning-muted)" },
  completed:              { label: "Completed",        color: "var(--color-text-muted)",      bg: "rgb(107 107 112 / 0.12)" },
  cancelled:              { label: "Cancelled",        color: "var(--color-destructive)",     bg: "var(--color-destructive-muted)" },

  // File
  informational:          { label: "For Discussion",   color: "var(--color-info)",            bg: "var(--color-info-muted)" },
  final:                  { label: "Final",            color: "var(--color-success)",         bg: "var(--color-success-muted)" },
  contractor_view:        { label: "Contractor",       color: "var(--color-accent)",          bg: "var(--color-accent-muted)" },
  superseded:             { label: "Superseded",       color: "var(--color-text-muted)",      bg: "rgb(107 107 112 / 0.12)" },

  // Leave
  leave_pending:          { label: "Pending",          color: "var(--color-warning)",         bg: "var(--color-warning-muted)" },
  leave_approved:         { label: "Approved",         color: "var(--color-success)",         bg: "var(--color-success-muted)" },
  leave_rejected:         { label: "Rejected",         color: "var(--color-destructive)",     bg: "var(--color-destructive-muted)" },

  // Invoice
  draft:                  { label: "Draft",            color: "var(--color-text-muted)",      bg: "rgb(107 107 112 / 0.12)" },
  sent:                   { label: "Sent",             color: "var(--color-info)",            bg: "var(--color-info-muted)" },
  partially_paid:         { label: "Part Paid",        color: "var(--color-warning)",         bg: "var(--color-warning-muted)" },
  paid:                   { label: "Paid",             color: "var(--color-success)",         bg: "var(--color-success-muted)" },
  overdue:                { label: "Overdue",          color: "var(--color-destructive)",     bg: "var(--color-destructive-muted)" },

  // RFI
  open:                   { label: "Open",             color: "var(--color-warning)",         bg: "var(--color-warning-muted)" },
  responded:              { label: "Responded",        color: "var(--color-success)",         bg: "var(--color-success-muted)" },
  closed:                 { label: "Closed",           color: "var(--color-text-muted)",      bg: "rgb(107 107 112 / 0.12)" },

  // Punch list
  resolved_by_contractor: { label: "Resolved",         color: "var(--color-info)",            bg: "var(--color-info-muted)" },
  confirmed_by_architect: { label: "Confirmed",        color: "var(--color-success)",         bg: "var(--color-success-muted)" },

  // Priority
  low:                    { label: "Low",              color: "var(--color-text-muted)",      bg: "rgb(107 107 112 / 0.08)" },
  medium:                 { label: "Medium",           color: "var(--color-info)",            bg: "var(--color-info-muted)" },
  high:                   { label: "High",             color: "var(--color-warning)",         bg: "var(--color-warning-muted)" },
  urgent:                 { label: "Urgent",           color: "var(--color-destructive)",     bg: "var(--color-destructive-muted)" },

  // VO
  draft_vo:               { label: "Draft",            color: "var(--color-text-muted)",      bg: "rgb(107 107 112 / 0.12)" },
  pending_client:         { label: "Pending Client",   color: "var(--color-warning)",         bg: "var(--color-warning-muted)" },
  vo_approved:            { label: "Approved",         color: "var(--color-success)",         bg: "var(--color-success-muted)" },
  vo_rejected:            { label: "Rejected",         color: "var(--color-destructive)",     bg: "var(--color-destructive-muted)" },

  // CRM
  new:                    { label: "New",              color: "var(--color-text-muted)",      bg: "rgb(107 107 112 / 0.12)" },
  contacted:              { label: "Contacted",        color: "var(--color-info)",            bg: "var(--color-info-muted)" },
  proposal_sent:          { label: "Proposal Sent",    color: "var(--color-warning)",         bg: "var(--color-warning-muted)" },
  negotiation:            { label: "Negotiation",      color: "var(--color-accent)",          bg: "var(--color-accent-muted)" },
  won:                    { label: "Won",              color: "var(--color-success)",         bg: "var(--color-success-muted)" },
  lost:                   { label: "Lost",             color: "var(--color-destructive)",     bg: "var(--color-destructive-muted)" },

  // Stage gate
  stage_pending:          { label: "Pending Approval", color: "var(--color-warning)",         bg: "var(--color-warning-muted)" },
  stage_approved:         { label: "Approved",         color: "var(--color-success)",         bg: "var(--color-success-muted)" },
};

const FALLBACK: StatusConfig = {
  label: "",
  color: "var(--color-text-muted)",
  bg: "rgb(107 107 112 / 0.12)",
};

interface StatusBadgeProps {
  status: StatusVariant;
  /** Override display label (defaults to STATUS_MAP label or prettified key). */
  label?: string;
  /** sm = compact text/padding, md = default, lg = larger */
  size?: "sm" | "md" | "lg";
  /** Show a filled dot indicator before the text. */
  dot?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  size = "md",
  dot = false,
  className = "",
}: StatusBadgeProps) {
  const cfg = STATUS_MAP[status] ?? FALLBACK;
  const displayLabel = label ?? (cfg.label || status.replace(/_/g, " "));

  const fontSize = size === "sm" ? "11px" : size === "lg" ? "13px" : "12px";
  const padding   = size === "sm" ? "2px 6px" : size === "lg" ? "4px 10px" : "2px 8px";

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize,
        fontWeight: 500,
        lineHeight: 1.4,
        letterSpacing: "0.01em",
        padding,
        borderRadius: "var(--radius-sm)",
        color: cfg.color,
        background: cfg.bg,
        whiteSpace: "nowrap",
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: cfg.color,
            flexShrink: 0,
          }}
        />
      )}
      {displayLabel}
    </span>
  );
}
