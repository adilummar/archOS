"use client";
/**
 * Sidebar — firm portal navigation shell.
 * Dark, flush with canvas. Icon + label nav with group headers.
 * Collapses to icon-only on mobile (< 768px).
 * Active state driven by usePathname.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "../../lib/store/auth.store";
import type { Role } from "../../lib/store/types";
import { Avatar } from "../shared/Avatar";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Clock,
  CalendarOff,
  FileText,
  Users,
  Users2,
  MessageSquare,
  BarChart2,
  Receipt,
  GitPullRequest,
  GitMerge,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  UserCheck,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  allowedRoles?: Role[];
  requiredFeature?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function getNavGroups(firmSlug: string, enabledFeatures: string[] = []): NavGroup[] {
  return [
    {
      label: "Workspace",
      items: [
        {
          label: "Dashboard", requiredFeature: "DASHBOARD",
          href: `/${firmSlug}/dashboard`,
          icon: <LayoutDashboard size={16} strokeWidth={1.5} />,
        },
        {
          label: "Staff", requiredFeature: "STAFF",
          href: `/${firmSlug}/staff`,
          icon: <Users2 size={16} strokeWidth={1.5} />,
          allowedRoles: ["admin", "team_lead"],
        },
        {
          label: "Projects", requiredFeature: "PROJECTS",
          href: `/${firmSlug}/projects`,
          icon: <FolderKanban size={16} strokeWidth={1.5} />,
          allowedRoles: ["admin", "team_lead", "staff"],
        },
        {
          label: "Tasks", requiredFeature: "TASKS",
          href: `/${firmSlug}/tasks`,
          icon: <CheckSquare size={16} strokeWidth={1.5} />,
          allowedRoles: ["admin", "team_lead", "staff"],
        },
        {
          label: "Attendance", requiredFeature: "ATTENDANCE",
          href: `/${firmSlug}/attendance`,
          icon: <UserCheck size={16} strokeWidth={1.5} />,
          allowedRoles: ["admin", "team_lead", "staff", "accounts"],
        },
        {
          label: "Time", requiredFeature: "TIME",
          href: `/${firmSlug}/time`,
          icon: <Clock size={16} strokeWidth={1.5} />,
        },
        {
          label: "Leave", requiredFeature: "LEAVE",
          href: `/${firmSlug}/leave`,
          icon: <CalendarOff size={16} strokeWidth={1.5} />,
        },
      ],
    },
    {
      label: "Project Ops",
      items: [
        {
          label: "Meetings", requiredFeature: "MEETINGS",
          href: `/${firmSlug}/meetings`,
          icon: <Users size={16} strokeWidth={1.5} />,
          allowedRoles: ["admin", "team_lead"],
        },
        {
          label: "RFIs", requiredFeature: "RFI",
          href: `/${firmSlug}/rfi`,
          icon: <MessageSquare size={16} strokeWidth={1.5} />,
          allowedRoles: ["admin", "team_lead"],
        },
        {
          label: "Site Reports", requiredFeature: "SITE_REPORTS",
          href: `/${firmSlug}/site-reports`,
          icon: <FileText size={16} strokeWidth={1.5} />,
          allowedRoles: ["admin", "team_lead"],
        },
      ],
    },
    {
      label: "Business",
      items: [
        {
          label: "CRM", requiredFeature: "CRM",
          href: `/${firmSlug}/crm`,
          icon: <BarChart2 size={16} strokeWidth={1.5} />,
          allowedRoles: ["admin", "accounts"],
        },
        {
          label: "Finance", requiredFeature: "FINANCE",
          href: `/${firmSlug}/finance`,
          icon: <Receipt size={16} strokeWidth={1.5} />,
          allowedRoles: ["admin", "accounts"],
        },
        {
          label: "Change Requests", requiredFeature: "CHANGE_REQUESTS",
          href: `/${firmSlug}/change-requests`,
          icon: <GitPullRequest size={16} strokeWidth={1.5} />,
          allowedRoles: ["admin", "team_lead", "accounts"],
        },
        {
          label: "Variation Orders", requiredFeature: "VARIATION_ORDERS",
          href: `/${firmSlug}/variation-orders`,
          icon: <GitMerge size={16} strokeWidth={1.5} />,
          allowedRoles: ["admin", "team_lead", "accounts"],
        },
      ],
    },
    {
      label: "Admin",
      items: [
        {
          label: "Settings",
          href: `/${firmSlug}/settings`,
          icon: <Settings size={16} strokeWidth={1.5} />,
          allowedRoles: ["admin"],
        },
      ],
    },
  ];
}

interface SidebarProps {
  firmSlug: string;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ firmSlug, collapsed, onToggle, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, firm } = useAuthStore();
  const navGroups = getNavGroups(firmSlug, firm?.enabledFeatures || []).map(group => ({
    ...group,
    items: group.items.filter(item => !item.requiredFeature || (firm?.enabledFeatures || []).includes(item.requiredFeature))
  })).filter(group => group.items.length > 0);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:sticky md:top-0 h-screen z-50 flex flex-col shrink-0 bg-sidebar border-r border-border transition-all duration-300 overflow-hidden`}
        style={{
          width: collapsed ? 56 : 220,
          minWidth: collapsed ? 56 : 220,
        }}
      >
  
      {/* Logo row */}
      <div
        style={{
          height: 52,
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          padding: collapsed ? "0 12px" : "0 16px",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "var(--radius-sm)",
            background: "var(--color-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Building2 size={14} strokeWidth={1.5} color="#fff" />
        </div>
        {!collapsed && (
          <span
            style={{
              fontSize: "var(--text-base)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {firm?.name ?? "ArchStudio"}
          </span>
        )}
      </div>

      {/* Nav groups */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: collapsed ? "10px 6px" : "10px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.allowedRoles || (user && item.allowedRoles.includes(user.role))
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} style={{ marginBottom: collapsed ? 6 : 10 }}>
              {!collapsed && (
                <span
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--color-text-muted)",
                    padding: "6px 8px 4px",
                  }}
                >
                  {group.label}
                </span>
              )}
              {collapsed && (
                <div
                  style={{
                    height: 1,
                    background: "var(--color-border)",
                    margin: "4px 4px 6px",
                  }}
                />
              )}
              {visibleItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                      onClick={() => onCloseMobile?.()}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: collapsed ? "8px" : "7px 10px",
                      borderRadius: "var(--radius-sm)",
                      background: active ? "var(--color-accent-muted)" : "transparent",
                      color: active ? "var(--color-accent)" : "var(--color-text-muted)",
                      fontSize: "var(--text-sm)",
                      fontWeight: active ? 500 : 400,
                      textDecoration: "none",
                      transition: "all var(--duration-fast)",
                      whiteSpace: "nowrap",
                      justifyContent: collapsed ? "center" : "flex-start",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "var(--color-bg-card-hover)";
                        e.currentTarget.style.color = "var(--color-text-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--color-text-muted)";
                      }
                    }}
                  >
                    {/* Active indicator */}
                    {active && (
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "25%",
                          height: "50%",
                          width: 2,
                          background: "var(--color-accent)",
                          borderRadius: "0 2px 2px 0",
                        }}
                      />
                    )}
                    <span style={{ flexShrink: 0 }}>{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User card + collapse toggle */}
      <div
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: collapsed ? "10px 6px" : "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-end",
            gap: 6,
            padding: "6px",
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            border: "none",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            fontSize: "var(--text-xs)",
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
          {collapsed ? <ChevronRight size={14} strokeWidth={1.5} /> : (
            <>
              <span>Collapse</span>
              <ChevronLeft size={14} strokeWidth={1.5} />
            </>
          )}
        </button>

        {/* User card */}
        {user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <Avatar
              name={user.name}
              color={user.avatarColor}
              initials={user.avatarInitials}
              size="sm"
            />
            {!collapsed && (
              <div style={{ overflow: "hidden" }}>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: 500,
                    color: "var(--color-text-primary)",
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.name}
                </p>
                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    textTransform: "capitalize",
                  }}
                >
                  {user.role.replace("_", " ")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
