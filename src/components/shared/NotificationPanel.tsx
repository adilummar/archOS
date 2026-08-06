"use client";
/**
 * NotificationPanel — slide-in panel from topbar bell.
 * Grouped by Today / Earlier. Mark all read. Click to navigate.
 * Task 11.2.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { format, isToday, parseISO } from "date-fns";
import { Bell, CheckCheck, X } from "lucide-react";
import { useNotificationStore } from "../../lib/store/notification.store";
import { useAuthStore } from "../../lib/store/auth.store";
import type { Notification } from "../../lib/store/types";

const TYPE_COLORS: Partial<Record<Notification["type"], string>> = {
  task_overdue: "var(--color-destructive)",
  task_assigned: "var(--color-accent)",
  change_request_new: "var(--color-warning)",
  client_approval_needed: "var(--color-info, #3b82f6)",
  client_approval_overdue: "var(--color-destructive)",
  leave_request_new: "var(--color-warning)",
  rfi_new: "var(--color-accent)",
  invoice_overdue: "var(--color-destructive)",
};

function NotifDot({ type }: { type: Notification["type"] }) {
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: TYPE_COLORS[type] ?? "var(--color-text-muted)",
        flexShrink: 0,
        marginTop: 5,
      }}
    />
  );
}

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const router = useRouter();
  const { user, firm } = useAuthStore();
  const { notifications, markRead, markAllRead } = useNotificationStore();
  const panelRef = useRef<HTMLDivElement>(null);

  const myNotifs = notifications
    .filter((n) => n.firmId === firm?.id && n.userId === user?.id)
    .slice(0, 50);

  const today = myNotifs.filter((n) => isToday(parseISO(n.createdAt)));
  const earlier = myNotifs.filter((n) => !isToday(parseISO(n.createdAt)));

  const handleNotifClick = (n: Notification) => {
    markRead(n.id);
    if (n.linkTo) {
      const firmSlug = firm?.name?.toLowerCase().replace(/\s+/g, "-") ?? "demo";
      // Extract just the path part if linkTo starts with /
      const path = n.linkTo.startsWith("/") ? n.linkTo : `/${n.linkTo}`;
      router.push(path);
    }
    onClose();
  };

  // Close on ESC or outside click
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 200 }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          top: 52,
          right: 12,
          width: 360,
          maxHeight: "min(600px, 80vh)",
          background: "var(--color-bg-elevated, var(--color-bg-card))",
          border: "1px solid var(--color-border-strong)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bell size={15} strokeWidth={1.5} color="var(--color-text-secondary)" />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
              Notifications
            </span>
            {myNotifs.filter((n) => !n.read).length > 0 && (
              <span
                style={{
                  background: "var(--color-accent)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 999,
                  padding: "0 6px",
                  lineHeight: "18px",
                }}
              >
                {myNotifs.filter((n) => !n.read).length}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {myNotifs.some((n) => !n.read) && (
              <button
                onClick={() => markAllRead(firm?.id ?? "", user?.id ?? "")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  fontSize: "var(--text-xs)",
                  padding: "4px 6px",
                  borderRadius: "var(--radius-sm)",
                }}
                title="Mark all as read"
              >
                <CheckCheck size={13} strokeWidth={1.5} />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 26,
                height: 26,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-muted)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {myNotifs.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 20px",
                gap: 8,
                color: "var(--color-text-muted)",
              }}
            >
              <Bell size={32} strokeWidth={1} opacity={0.4} />
              <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 500 }}>All caught up</p>
              <p style={{ margin: 0, fontSize: "var(--text-xs)" }}>No notifications yet.</p>
            </div>
          ) : (
            <>
              {today.length > 0 && (
                <NotifGroup label="Today" notifications={today} onNotifClick={handleNotifClick} />
              )}
              {earlier.length > 0 && (
                <NotifGroup label="Earlier" notifications={earlier} onNotifClick={handleNotifClick} />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function NotifGroup({
  label,
  notifications,
  onNotifClick,
}: {
  label: string;
  notifications: Notification[];
  onNotifClick: (n: Notification) => void;
}) {
  return (
    <div>
      <div
        style={{
          padding: "8px 16px 4px",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
        }}
      >
        {label}
      </div>
      {notifications.map((n) => (
        <button
          key={n.id}
          onClick={() => onNotifClick(n)}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            width: "100%",
            padding: "10px 16px",
            background: n.read ? "transparent" : "var(--color-accent-muted, rgba(229,82,48,0.06))",
            border: "none",
            borderBottom: "1px solid var(--color-border)",
            cursor: "pointer",
            textAlign: "left",
            transition: "background var(--duration-fast)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-card-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? "transparent" : "var(--color-accent-muted, rgba(229,82,48,0.06))"; }}
        >
          <NotifDot type={n.type} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: "var(--text-sm)",
                fontWeight: n.read ? 400 : 600,
                color: "var(--color-text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {n.title}
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "var(--text-xs)",
                color: "var(--color-text-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {n.body}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--color-text-muted)" }}>
              {format(parseISO(n.createdAt), "h:mm a")}
            </p>
          </div>
          {!n.read && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--color-accent)",
                flexShrink: 0,
                marginTop: 6,
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
