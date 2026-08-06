"use client";
/**
 * Topbar — page title, ⌘K search trigger, notification bell, user dropdown.
 * Sticky at top of content area.
 */

import { useRouter } from "next/navigation";
import { Bell, Search, LogOut, ChevronDown, User } from "lucide-react";
import { useAuthStore } from "../../lib/store/auth.store";
import { useNotificationStore } from "../../lib/store/notification.store";
import { Avatar } from "../shared/Avatar";
import { useState } from "react";

interface TopbarProps {
  title: string;
  firmSlug: string;
}

export function Topbar({ title, firmSlug }: TopbarProps) {
  const router = useRouter();
  const { user, firm } = useAuthStore();
  const { notifications } = useNotificationStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const unreadCount = notifications.filter(
    (n) => !n.read && n.firmId === firm?.id && n.userId === user?.id
  ).length;

  const handleLogout = () => {
    useAuthStore.getState().logout();
    router.push("/");
  };

  return (
    <header
      style={{
        height: 52,
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-bg-canvas)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px 0 24px",
        position: "sticky",
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Page title */}
      <h1
        style={{
          fontSize: "var(--text-base)",
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          color: "var(--color-text-primary)",
          margin: 0,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h1>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Search trigger */}
        <button
          id="topbar-search"
          title="Search (⌘K)"
          onClick={() => {
            // Will be connected to CommandPalette in task 11.1
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 12px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
            fontSize: "var(--text-sm)",
            cursor: "pointer",
            transition: "all var(--duration-fast)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border-strong)";
            e.currentTarget.style.color = "var(--color-text-secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.color = "var(--color-text-muted)";
          }}
        >
          <Search size={13} strokeWidth={1.5} />
          <span>Search</span>
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              padding: "1px 5px",
              borderRadius: 3,
              background: "var(--color-bg-input)",
              border: "1px solid var(--color-border)",
            }}
          >
            ⌘K
          </span>
        </button>

        {/* Notification bell */}
        <button
          id="topbar-notifications"
          title="Notifications"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            border: "none",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            transition: "all var(--duration-fast)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-bg-card-hover)";
            e.currentTarget.style.color = "var(--color-text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--color-text-muted)";
          }}
        >
          <Bell size={16} strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 5,
                right: 5,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--color-accent)",
                border: "1.5px solid var(--color-bg-canvas)",
              }}
            />
          )}
        </button>

        {/* User dropdown */}
        <div style={{ position: "relative" }}>
          <button
            id="topbar-user-menu"
            onClick={() => setUserMenuOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              background: userMenuOpen ? "var(--color-bg-card-hover)" : "transparent",
              border: "none",
              cursor: "pointer",
              transition: "all var(--duration-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-bg-card-hover)";
            }}
            onMouseLeave={(e) => {
              if (!userMenuOpen) e.currentTarget.style.background = "transparent";
            }}
          >
            {user && (
              <Avatar
                name={user.name}
                color={user.avatarColor}
                initials={user.avatarInitials}
                size="sm"
              />
            )}
            <ChevronDown
              size={12}
              strokeWidth={2}
              style={{
                color: "var(--color-text-muted)",
                transform: userMenuOpen ? "rotate(180deg)" : "none",
                transition: "transform var(--duration-fast)",
              }}
            />
          </button>

          {userMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 40,
                }}
                onClick={() => setUserMenuOpen(false)}
              />
              {/* Dropdown */}
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  width: 200,
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border-strong)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-elevated)",
                  zIndex: 50,
                  overflow: "hidden",
                  padding: "4px",
                }}
              >
                {/* User info */}
                <div
                  style={{
                    padding: "8px 12px 10px",
                    borderBottom: "1px solid var(--color-border)",
                    marginBottom: 4,
                  }}
                >
                  <p
                    style={{
                      fontSize: "var(--text-sm)",
                      fontWeight: 500,
                      color: "var(--color-text-primary)",
                      margin: "0 0 2px",
                    }}
                  >
                    {user?.name}
                  </p>
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-muted)",
                      margin: 0,
                      textTransform: "capitalize",
                    }}
                  >
                    {user?.designation}
                  </p>
                </div>
                {/* Profile item */}
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "var(--radius-sm)",
                    background: "transparent",
                    border: "none",
                    color: "var(--color-text-secondary)",
                    fontSize: "var(--text-sm)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all var(--duration-fast)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-bg-card-hover)";
                    e.currentTarget.style.color = "var(--color-text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                  }}
                >
                  <User size={13} strokeWidth={1.5} />
                  Profile
                </button>
                {/* Logout */}
                <button
                  id="topbar-logout"
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "var(--radius-sm)",
                    background: "transparent",
                    border: "none",
                    color: "var(--color-text-muted)",
                    fontSize: "var(--text-sm)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all var(--duration-fast)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(240,80,48,0.08)";
                    e.currentTarget.style.color = "var(--color-accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--color-text-muted)";
                  }}
                >
                  <LogOut size={13} strokeWidth={1.5} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
