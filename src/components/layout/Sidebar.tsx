"use client";
/**
 * Sidebar — Arch OS Obsidian navigation shell.
 * Reference: docs/design/arch-os-design-system.md & arch-os-dashboard.html
 * - 62px width, 2px solid #2B2B2B frame, rounded right corners 10px, background #0B0B0B.
 * - Icon-only navigation with 44x44px interactive targets.
 * - Active item fill: #1E2A22 with #FFFFFF icon.
 * - Inactive item: #BDB8B2.
 * - Pinned Settings at the bottom.
 * - Preserves all existing role and feature permissions.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "../../lib/store/auth.store";
import type { Role } from "../../lib/store/types";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users2,
  UserCheck,
  Settings,
  MoreHorizontal,
  X,
  FileText,
  Users,
  Receipt,
  GitPullRequest
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  allowedRoles?: Role[];
  requiredFeature?: string;
}

export function Sidebar({
  firmSlug,
  mobileOpen = false,
  onCloseMobile,
}: {
  firmSlug: string;
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const { user, firm } = useAuthStore();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const enabledFeatures = firm?.enabledFeatures ?? [];
  const userRole = user?.role as Role | undefined;

  const isFeatureAllowed = (feature?: string) => {
    if (!feature) return true;
    return enabledFeatures.includes(feature);
  };

  const isRoleAllowed = (allowedRoles?: Role[]) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    if (!userRole) return false;
    return allowedRoles.includes(userRole);
  };

  // Primary navigation items (matching Obsidian reference + core firm operations)
  const primaryItems: NavItem[] = [
    {
      id: "home",
      label: "Home",
      href: `/${firmSlug}/dashboard`,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3 11l9-8 9 8v10h-6v-6H9v6H3z"/>
        </svg>
      ),
      requiredFeature: "DASHBOARD",
    },
    {
      id: "projects",
      label: "Projects",
      href: `/${firmSlug}/projects`,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 3l10 5-10 5L2 8zM2 12l10 5 10-5v3l-10 5-10-5z"/>
        </svg>
      ),
      requiredFeature: "PROJECTS",
      allowedRoles: ["admin", "team_lead", "staff"],
    },
    {
      id: "tasks",
      label: "Tasks and approvals",
      href: `/${firmSlug}/tasks`,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="3" y="4" width="18" height="6" rx="3"/>
          <rect x="3" y="12" width="18" height="8" rx="3"/>
        </svg>
      ),
      requiredFeature: "TASKS",
      allowedRoles: ["admin", "team_lead", "staff"],
    },
    {
      id: "staff",
      label: "Staff",
      href: `/${firmSlug}/staff`,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 21c0-5 4-7 8-7s8 2 8 7z"/>
        </svg>
      ),
      requiredFeature: "STAFF",
      allowedRoles: ["admin", "team_lead", "staff", "accounts"],
    },
  ];

  // Secondary items in overflow menu
  const secondaryItems: NavItem[] = [
    {
      id: "meetings",
      label: "Meetings",
      href: `/${firmSlug}/meetings`,
      icon: <Users size={18} strokeWidth={1.8} />,
      requiredFeature: "MEETINGS",
      allowedRoles: ["admin", "team_lead"],
    },
    {
      id: "finance",
      label: "Finance",
      href: `/${firmSlug}/finance`,
      icon: <Receipt size={18} strokeWidth={1.8} />,
      requiredFeature: "FINANCE",
      allowedRoles: ["admin", "accounts"],
    },
    {
      id: "change-requests",
      label: "Change Requests",
      href: `/${firmSlug}/change-requests`,
      icon: <GitPullRequest size={18} strokeWidth={1.8} />,
      requiredFeature: "CHANGE_REQUESTS",
      allowedRoles: ["admin", "team_lead"],
    },
  ];

  const visiblePrimary = primaryItems.filter(
    (item) => isFeatureAllowed(item.requiredFeature) && isRoleAllowed(item.allowedRoles)
  );

  const visibleSecondary = secondaryItems.filter(
    (item) => isFeatureAllowed(item.requiredFeature) && isRoleAllowed(item.allowedRoles)
  );

  const isSettingsActive = pathname.startsWith(`/${firmSlug}/settings`);

  const sidebarContent = (
    <nav
      aria-label="Main"
      style={{
        position: "relative",
        width: 62,
        height: "calc(100vh - 48px)",
        margin: "24px 0",
        border: "2px solid #2B2B2B",
        borderLeft: 0,
        borderRadius: "0 10px 10px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "14px 0",
        gap: 6,
        boxSizing: "border-box",
        background: "#0B0B0B",
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* Top 3 dots */}
      <span
        style={{
          color: "#BDB8B2",
          letterSpacing: 2,
          fontSize: 18,
          marginBottom: 16,
          lineHeight: 1,
          userSelect: "none",
        }}
        aria-hidden="true"
      >
        ···
      </span>

      {/* Primary Items */}
      {visiblePrimary.map((item) => {
        const isActive = pathname === item.href || (item.id !== "home" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-label={item.label}
            title={item.label}
            className="ib"
            onClick={onCloseMobile}
            style={{
              color: isActive ? "#FFFFFF" : "#BDB8B2",
              background: isActive ? "#1E2A22" : "transparent",
              textDecoration: "none",
            }}
          >
            {item.icon}
          </Link>
        );
      })}

      {/* Overflow Menu Button (if secondary items exist) */}
      {visibleSecondary.length > 0 && (
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="ib"
            aria-label="More modules"
            title="More modules"
            onClick={() => setShowMoreMenu((v) => !v)}
            style={{
              color: showMoreMenu ? "#FFFFFF" : "#BDB8B2",
              background: showMoreMenu ? "rgba(255, 255, 255, 0.08)" : "transparent",
            }}
          >
            <MoreHorizontal size={20} strokeWidth={2} />
          </button>

          {showMoreMenu && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 49 }}
                onClick={() => setShowMoreMenu(false)}
              />
              <div
                style={{
                  position: "absolute",
                  left: "calc(100% + 12px)",
                  top: -10,
                  width: 200,
                  background: "linear-gradient(160deg, #4A4743 0%, #34322F 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: 10,
                  padding: "8px 6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  zIndex: 50,
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
                }}
              >
                {visibleSecondary.map((sItem) => {
                  const isSecActive = pathname.startsWith(sItem.href);
                  return (
                    <Link
                      key={sItem.id}
                      href={sItem.href}
                      onClick={() => {
                        setShowMoreMenu(false);
                        onCloseMobile?.();
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontFamily: "var(--font-sans)",
                        color: isSecActive ? "#FFFFFF" : "#F3F1EE",
                        background: isSecActive ? "#1E2A22" : "transparent",
                        textDecoration: "none",
                        transition: "background 150ms ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSecActive) e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSecActive) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {sItem.icon}
                      <span>{sItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Flexible Spacer */}
      <div style={{ flex: 1 }} />

      {/* Pinned Settings Item */}
      <Link
        href={`/${firmSlug}/settings`}
        aria-label="Settings"
        title="Settings"
        className="ib"
        onClick={onCloseMobile}
        style={{
          color: isSettingsActive ? "#FFFFFF" : "#BDB8B2",
          background: isSettingsActive ? "#1E2A22" : "transparent",
          textDecoration: "none",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
        </svg>
      </Link>
    </nav>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <div className="hidden md:block" style={{ width: 62, flexShrink: 0 }}>
        <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 30 }}>
          {sidebarContent}
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden" style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex" }}>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.7)" }}
            onClick={onCloseMobile}
          />
          <div style={{ position: "relative", zIndex: 61 }}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
