"use client";
/**
 * Leave Management Page — Phase 6
 * My Leave tab: submit form + history table + approved-days calendar chips.
 * Team Leave tab (admin/team_lead): pending approval queue + upcoming approved list.
 */

import { useState, useEffect } from "react";
import { format, parseISO, differenceInCalendarDays, addDays, isSameDay } from "date-fns";
import { CalendarDays, CheckCircle2, XCircle, Clock3, Users, ChevronRight } from "lucide-react";
import { useLeaveStore } from "@/lib/store/leave.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { Avatar } from "@/components/shared/Avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "@/lib/store/toast.store";
import type { LeaveRequest } from "@/lib/store/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const diff = differenceInCalendarDays(parseISO(end), parseISO(start));
  return diff >= 0 ? diff + 1 : 0;
}

function fmtDate(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM yyyy");
  } catch {
    return iso;
  }
}

function fmtShort(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM");
  } catch {
    return iso;
  }
}

function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ height = 80 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        background: "var(--color-bg-card)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
      }}
    />
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        color: "var(--color-text-muted)",
        display: "block",
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--color-bg-input)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-text-primary)",
  fontSize: "var(--text-sm)",
  padding: "9px 12px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color var(--duration-fast)",
};

// ─── Approved-days Mini-Calendar ─────────────────────────────────────────────

function ApprovedDaysCalendar({ approvedRanges }: { approvedRanges: Array<{ start: string; end: string; name?: string }> }) {
  // Show next 30 days as date chips, highlight approved ones
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => addDays(today, i));

  const isApproved = (date: Date) =>
    approvedRanges.some(({ start, end }) => {
      const s = parseISO(start);
      const e = parseISO(end);
      return date >= s && date <= e;
    });

  const getNote = (date: Date): string => {
    const match = approvedRanges.find(({ start, end }) => {
      return date >= parseISO(start) && date <= parseISO(end);
    });
    return match?.name ?? "";
  };

  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 16,
      }}
    >
      <p
        style={{
          margin: "0 0 12px",
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Approved Leave — Next 30 Days
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {days.map((d) => {
          const approved = isApproved(d);
          const note = getNote(d);
          const isToday = isSameDay(d, today);
          return (
            <div
              key={d.toISOString()}
              title={note || undefined}
              style={{
                width: 34,
                height: 34,
                borderRadius: "var(--radius-sm)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: approved
                  ? "var(--color-success-muted)"
                  : isToday
                  ? "var(--color-accent-muted)"
                  : "var(--color-bg-input)",
                border: `1px solid ${
                  approved
                    ? "var(--color-success)"
                    : isToday
                    ? "var(--color-accent)"
                    : "var(--color-border)"
                }`,
                cursor: note ? "default" : "default",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: approved
                    ? "var(--color-success)"
                    : isToday
                    ? "var(--color-accent)"
                    : "var(--color-text-muted)",
                  lineHeight: 1,
                }}
              >
                {format(d, "d")}
              </span>
              <span
                style={{
                  fontSize: 8,
                  color: approved
                    ? "var(--color-success)"
                    : isToday
                    ? "var(--color-accent)"
                    : "var(--color-text-muted)",
                  lineHeight: 1,
                  marginTop: 1,
                }}
              >
                {format(d, "EEE")}
              </span>
            </div>
          );
        })}
      </div>
      {approvedRanges.length === 0 && (
        <p style={{ margin: "8px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          No approved leave in the next 30 days
        </p>
      )}
    </div>
  );
}

// ─── Th helper ───────────────────────────────────────────────────────────────

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th
      style={{
        padding: "10px 14px",
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        color: "var(--color-text-muted)",
        textAlign: "left",
        borderBottom: "1px solid var(--color-border)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  muted = false,
}: {
  children?: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <td
      style={{
        padding: "12px 14px",
        fontSize: "var(--text-sm)",
        color: muted ? "var(--color-text-muted)" : "var(--color-text-secondary)",
        borderBottom: "1px solid var(--color-border)",
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 0",
        gap: 10,
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        color: "var(--color-text-muted)",
      }}
    >
      <div style={{ opacity: 0.35 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>{text}</p>
    </div>
  );
}

// ─── Section heading ─────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        margin: "0 0 12px",
        fontSize: "var(--text-base)",
        fontWeight: 600,
        color: "var(--color-text-primary)",
      }}
    >
      {children}
    </h3>
  );
}

// ─── Reject Inline Component ─────────────────────────────────────────────────

function RejectInline({
  onConfirm,
  onCancel,
}: {
  onConfirm: (note: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
      }}
    >
      <input
        autoFocus
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Reason for rejection…"
        style={{
          ...inputStyle,
          width: 220,
          padding: "6px 10px",
          fontSize: "var(--text-xs)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-destructive)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
        onKeyDown={(e) => {
          if (e.key === "Enter" && note.trim()) onConfirm(note.trim());
          if (e.key === "Escape") onCancel();
        }}
      />
      <button
        onClick={() => note.trim() && onConfirm(note.trim())}
        style={{
          background: "var(--color-destructive)",
          border: "none",
          borderRadius: "var(--radius-sm)",
          color: "#fff",
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          padding: "6px 12px",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Confirm Reject
      </button>
      <button
        onClick={onCancel}
        style={{
          background: "transparent",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          color: "var(--color-text-muted)",
          fontSize: "var(--text-xs)",
          padding: "6px 10px",
          cursor: "pointer",
        }}
      >
        Cancel
      </button>
    </div>
  );
}

// ─── My Leave Tab ────────────────────────────────────────────────────────────

function MyLeaveTab({
  firmId,
  userId,
  userName,
  myRequests,
}: {
  firmId: string;
  userId: string;
  userName: string;
  myRequests: LeaveRequest[];
}) {
  const { submit } = useLeaveStore();
  const { users } = useFirmStore();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const days = calcDays(startDate, endDate);

  const handleSubmit = () => {
    if (!startDate || !endDate) {
      toast("Please select start and end dates", "error");
      return;
    }
    if (days <= 0) {
      toast("End date must be on or after start date", "error");
      return;
    }
    setSubmitting(true);
    submit({ firmId, userId, userName, startDate, endDate, days, reason: reason.trim() || undefined });
    toast("Leave request submitted", "success");
    setStartDate("");
    setEndDate("");
    setReason("");
    setTimeout(() => setSubmitting(false), 300);
  };

  const approvedRanges = myRequests
    .filter((r) => r.status === "approved")
    .map((r) => ({ start: r.startDate, end: r.endDate }));

  const reviewerName = (id?: string) => {
    if (!id) return "—";
    return users.find((u) => u.id === id)?.name ?? "—";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Submit form */}
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: 20,
        }}
      >
        <h3
          style={{
            margin: "0 0 16px",
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}
        >
          Request Leave
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
          <div>
            <FieldLabel>Start Date</FieldLabel>
            <input
              type="date"
              value={startDate}
              min={todayIso()}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate && e.target.value > endDate) setEndDate(e.target.value);
              }}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          <div>
            <FieldLabel>End Date</FieldLabel>
            <input
              type="date"
              value={endDate}
              min={startDate || todayIso()}
              onChange={(e) => setEndDate(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          {/* Days pill */}
          <div
            style={{
              background: days > 0 ? "var(--color-accent-muted)" : "var(--color-bg-input)",
              border: `1px solid ${days > 0 ? "var(--color-accent)" : "var(--color-border)"}`,
              borderRadius: "var(--radius-sm)",
              padding: "9px 14px",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 700,
                color: days > 0 ? "var(--color-accent)" : "var(--color-text-muted)",
              }}
            >
              {days > 0 ? `${days} day${days !== 1 ? "s" : ""}` : "— days"}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <FieldLabel>Reason (optional)</FieldLabel>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly describe the reason for your leave…"
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.5,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          />
        </div>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleSubmit}
            disabled={submitting || !startDate || !endDate || days <= 0}
            style={{
              background: "var(--color-accent)",
              border: "none",
              borderRadius: "var(--radius-md)",
              color: "#fff",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              padding: "10px 24px",
              cursor: submitting || !startDate || !endDate || days <= 0 ? "not-allowed" : "pointer",
              opacity: submitting || !startDate || !endDate || days <= 0 ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "opacity var(--duration-fast)",
            }}
          >
            <CalendarDays size={15} />
            Submit Request
          </button>
        </div>
      </div>

      {/* Approved leave calendar */}
      {approvedRanges.length > 0 && (
        <ApprovedDaysCalendar approvedRanges={approvedRanges} />
      )}

      {/* History table */}
      <div>
        <SectionHeading>Leave History</SectionHeading>

        {myRequests.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={36} strokeWidth={1.2} />}
            text="No leave requests yet — submit your first request above"
          />
        ) : (
          <div
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "var(--color-bg-sidebar)" }}>
                <tr>
                  <Th>Dates</Th>
                  <Th>Days</Th>
                  <Th>Reason</Th>
                  <Th>Status</Th>
                  <Th>Reviewed By</Th>
                  <Th>Submitted</Th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((req) => (
                  <tr
                    key={req.id}
                    style={{ transition: "background var(--duration-fast)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--color-bg-card-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Td>
                      <span style={{ fontWeight: 500, color: "var(--color-text-primary)", fontSize: "var(--text-sm)" }}>
                        {fmtShort(req.startDate)}
                      </span>
                      <ChevronRight size={12} style={{ margin: "0 2px", opacity: 0.4 }} />
                      <span style={{ fontWeight: 500, color: "var(--color-text-primary)", fontSize: "var(--text-sm)" }}>
                        {fmtShort(req.endDate)}
                      </span>
                    </Td>
                    <Td muted>
                      {req.days} day{req.days !== 1 ? "s" : ""}
                    </Td>
                    <Td>
                      <span
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          maxWidth: 260,
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {req.reason || <span style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>No reason given</span>}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge
                        status={`leave_${req.status}`}
                        dot
                      />
                      {req.rejectionNote && (
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: "var(--text-xs)",
                            color: "var(--color-destructive)",
                            maxWidth: 200,
                          }}
                        >
                          {req.rejectionNote}
                        </p>
                      )}
                    </Td>
                    <Td muted>{reviewerName(req.reviewedById)}</Td>
                    <Td muted>{fmtDate(req.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Team Leave Tab ───────────────────────────────────────────────────────────

function TeamLeaveTab({
  firmId,
  reviewerId,
  allRequests,
}: {
  firmId: string;
  reviewerId: string;
  allRequests: LeaveRequest[];
}) {
  const { approve, reject } = useLeaveStore();
  const { users } = useFirmStore();

  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const pendingRequests = allRequests.filter((r) => r.status === "pending");

  const today = todayIso();
  const upcomingApproved = allRequests
    .filter((r) => r.status === "approved" && r.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const handleApprove = (id: string) => {
    approve(id, reviewerId);
    toast("Leave approved", "success");
  };

  const handleReject = (id: string, note: string) => {
    reject(id, reviewerId, note);
    setRejectingId(null);
    toast("Leave rejected", "warning");
  };

  const getUserName = (userId: string) =>
    users.find((u) => u.id === userId)?.name ?? "Unknown";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Approval queue */}
      <div>
        <SectionHeading>
          Pending Approval
          {pendingRequests.length > 0 && (
            <span
              style={{
                marginLeft: 8,
                background: "var(--color-warning-muted)",
                color: "var(--color-warning)",
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {pendingRequests.length}
            </span>
          )}
        </SectionHeading>

        {pendingRequests.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={36} strokeWidth={1.2} />}
            text="All clear — no pending leave requests"
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingRequests.map((req) => {
              const name = getUserName(req.userId);
              const isRejecting = rejectingId === req.id;

              return (
                <div
                  key={req.id}
                  style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "14px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {/* Top row: info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <Avatar name={name} size="md" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "var(--text-sm)",
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {name}
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {fmtDate(req.startDate)} → {fmtDate(req.endDate)} &nbsp;·&nbsp;{" "}
                        {req.days} day{req.days !== 1 ? "s" : ""}
                      </p>
                      {req.reason && (
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: "var(--text-xs)",
                            color: "var(--color-text-secondary)",
                            fontStyle: "italic",
                          }}
                        >
                          "{req.reason}"
                        </p>
                      )}
                    </div>

                    {/* Submitted date */}
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmtDate(req.createdAt)}
                    </span>

                    {/* Action buttons — only shown when not in reject mode */}
                    {!isRejecting && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleApprove(req.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            background: "var(--color-success-muted)",
                            border: "1px solid var(--color-success)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--color-success)",
                            fontSize: "var(--text-xs)",
                            fontWeight: 600,
                            padding: "6px 12px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            transition: "opacity var(--duration-fast)",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                        >
                          <CheckCircle2 size={13} />
                          Approve
                        </button>

                        <button
                          onClick={() => setRejectingId(req.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            background: "var(--color-destructive-muted)",
                            border: "1px solid var(--color-destructive)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--color-destructive)",
                            fontSize: "var(--text-xs)",
                            fontWeight: 600,
                            padding: "6px 12px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            transition: "opacity var(--duration-fast)",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                        >
                          <XCircle size={13} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline reject reason */}
                  {isRejecting && (
                    <div
                      style={{
                        borderTop: "1px solid var(--color-border)",
                        paddingTop: 10,
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 8px",
                          fontSize: "var(--text-xs)",
                          color: "var(--color-destructive)",
                          fontWeight: 500,
                        }}
                      >
                        Provide a reason for rejection:
                      </p>
                      <RejectInline
                        onConfirm={(note) => handleReject(req.id, note)}
                        onCancel={() => setRejectingId(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming approved leaves */}
      <div>
        <SectionHeading>Upcoming Approved Leave</SectionHeading>

        {upcomingApproved.length === 0 ? (
          <EmptyState
            icon={<Users size={36} strokeWidth={1.2} />}
            text="No approved upcoming leave — the full team will be in"
          />
        ) : (
          <div
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "var(--color-bg-sidebar)" }}>
                <tr>
                  <Th>Staff</Th>
                  <Th>From</Th>
                  <Th>To</Th>
                  <Th>Days</Th>
                  <Th>Reason</Th>
                </tr>
              </thead>
              <tbody>
                {upcomingApproved.map((req) => {
                  const name = getUserName(req.userId);
                  const isCurrentlyAway =
                    req.startDate <= today && req.endDate >= today;

                  return (
                    <tr
                      key={req.id}
                      style={{ transition: "background var(--duration-fast)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--color-bg-card-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <Td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar name={name} size="sm" />
                          <div>
                            <span
                              style={{
                                fontSize: "var(--text-sm)",
                                fontWeight: 500,
                                color: "var(--color-text-primary)",
                              }}
                            >
                              {name}
                            </span>
                            {isCurrentlyAway && (
                              <span
                                style={{
                                  marginLeft: 6,
                                  fontSize: 10,
                                  background: "var(--color-warning-muted)",
                                  color: "var(--color-warning)",
                                  padding: "1px 6px",
                                  borderRadius: "var(--radius-sm)",
                                  fontWeight: 600,
                                }}
                              >
                                Away now
                              </span>
                            )}
                          </div>
                        </div>
                      </Td>
                      <Td>{fmtDate(req.startDate)}</Td>
                      <Td>{fmtDate(req.endDate)}</Td>
                      <Td muted>
                        {req.days} day{req.days !== 1 ? "s" : ""}
                      </Td>
                      <Td>
                        {req.reason ? (
                          <span style={{ color: "var(--color-text-secondary)" }}>
                            {req.reason}
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>
                            —
                          </span>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LeavePage() {
  const { user, firm } = useAuthStore();
  const { requests } = useLeaveStore();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"my" | "team">("my");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const canSeeTeam =
    user?.role === "admin" || user?.role === "team_lead";

  const firmRequests = requests.filter((r) => r.firmId === firm?.id);
  const myRequests = firmRequests.filter((r) => r.userId === user?.id);

  // ── Skeleton ──
  if (loading) {
    return (
      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
        <Skeleton height={40} />
        <Skeleton height={180} />
        <Skeleton height={120} />
        <Skeleton height={200} />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        background: "var(--color-bg-canvas)",
        minHeight: "100%",
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "var(--text-xl)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}
        >
          Leave
        </h1>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            background: "var(--color-bg-input)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
            padding: 2,
          }}
        >
          {(
            [
              { key: "my", label: "My Leave", icon: <Clock3 size={13} /> },
              ...(canSeeTeam
                ? [{ key: "team", label: "Team Leave", icon: <Users size={13} /> }]
                : []),
            ] as Array<{ key: "my" | "team"; label: string; icon: React.ReactNode }>
          ).map(({ key, label, icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  background: active ? "var(--color-bg-card-hover)" : "transparent",
                  border: "none",
                  color: active ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  padding: "6px 14px",
                  borderRadius: "calc(var(--radius-sm) - 2px)",
                  fontSize: "var(--text-sm)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontWeight: active ? 600 : 400,
                  transition: "all var(--duration-fast)",
                }}
              >
                {icon}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      {activeTab === "my" && user && firm && (
        <MyLeaveTab
          firmId={firm.id}
          userId={user.id}
          userName={user.name}
          myRequests={myRequests}
        />
      )}

      {activeTab === "team" && canSeeTeam && user && firm && (
        <TeamLeaveTab
          firmId={firm.id}
          reviewerId={user.id}
          allRequests={firmRequests}
        />
      )}
    </div>
  );
}
