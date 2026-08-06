"use client";
/**
 * Project Detail — sticky header, stage timeline, tabbed content.
 * Tasks 4.3–4.18.
 * Tabs: Overview | Tasks | Files | Meetings | RFIs | Punch List | Site Reports
 *       | Change Requests | Variation Orders | Finance | Chat | Activity
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  ArrowLeft, AlertTriangle, ChevronRight, Key,
  CheckSquare, FileText, Users, MessageSquare,
  BarChart2, ListChecks, ClipboardList,
  GitPullRequest, GitMerge, DollarSign, MessageCircle, Activity,
  Layers,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { useTaskStore } from "@/lib/store/task.store";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarGroup } from "@/components/shared/Avatar";
import { OverviewTab } from "@/components/project/OverviewTab";
import { TasksTab } from "@/components/project/TasksTab";
import { FilesTab } from "@/components/project/FilesTab";
import { RfiTab } from "@/components/project/RfiTab";
import { MeetingsTab } from "@/components/project/MeetingsTab";
import { PunchListTab } from "@/components/project/PunchListTab";
import { SiteReportsTab } from "@/components/project/SiteReportsTab";
import { ChangeRequestsTab } from "@/components/project/ChangeRequestsTab";
import { VoTab } from "@/components/project/VoTab";
import { FinanceTab } from "@/components/project/FinanceTab";
import { ChatTab } from "@/components/project/ChatTab";
import { ActivityTab } from "@/components/project/ActivityTab";
import type { Project, ProjectStage } from "@/lib/store/types";

// ─── Tab Config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",        label: "Overview",         icon: <Layers size={14} strokeWidth={1.5} /> },
  { id: "tasks",           label: "Tasks",            icon: <CheckSquare size={14} strokeWidth={1.5} /> },
  { id: "files",           label: "Files",            icon: <FileText size={14} strokeWidth={1.5} /> },
  { id: "meetings",        label: "Meetings",         icon: <Users size={14} strokeWidth={1.5} /> },
  { id: "rfi",             label: "RFIs",             icon: <MessageSquare size={14} strokeWidth={1.5} /> },
  { id: "punchlist",       label: "Punch List",       icon: <ListChecks size={14} strokeWidth={1.5} /> },
  { id: "site-reports",    label: "Site Reports",     icon: <ClipboardList size={14} strokeWidth={1.5} /> },
  { id: "change-requests", label: "Change Requests",  icon: <GitPullRequest size={14} strokeWidth={1.5} /> },
  { id: "vo",              label: "Variation Orders", icon: <GitMerge size={14} strokeWidth={1.5} /> },
  { id: "finance",         label: "Finance",          icon: <DollarSign size={14} strokeWidth={1.5} />, adminOnly: true },
  { id: "chat",            label: "Chat",             icon: <MessageCircle size={14} strokeWidth={1.5} /> },
  { id: "activity",        label: "Activity",         icon: <Activity size={14} strokeWidth={1.5} /> },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── Stage Timeline ───────────────────────────────────────────────────────────

function StageTimeline({ project }: { project: Project }) {
  return (
    <div
      style={{
        padding: "0 28px 16px",
        borderBottom: "1px solid var(--color-border)",
        overflowX: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 0,
          minWidth: "max-content",
          position: "relative",
        }}
      >
        {project.stages.map((stage, i) => {
          const isCurrent = stage.id === project.currentStageId;
          const isCompleted = stage.status === "completed";
          const isPending = stage.status === "pending";
          const needsApproval =
            stage.isClientApprovalRequired && stage.clientApprovalStatus === "pending";
          const isLast = i === project.stages.length - 1;

          return (
            <div
              key={stage.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                flex: 1,
                minWidth: 90,
              }}
            >
              {/* Connector line */}
              {!isLast && (
                <div
                  style={{
                    position: "absolute",
                    top: 11,
                    left: "50%",
                    right: "-50%",
                    height: 2,
                    background: isCompleted
                      ? "var(--color-success)"
                      : "var(--color-border)",
                    zIndex: 0,
                  }}
                />
              )}

              {/* Stage node */}
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: isCompleted
                    ? "var(--color-success)"
                    : isCurrent
                    ? "var(--color-accent)"
                    : "var(--color-bg-input)",
                  border: `2px solid ${
                    isCompleted
                      ? "var(--color-success)"
                      : isCurrent
                      ? "var(--color-accent)"
                      : "var(--color-border)"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  zIndex: 1,
                  flexShrink: 0,
                  animation: isCurrent ? "stagePulse 2s ease-in-out infinite" : "none",
                }}
              >
                {isCompleted && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
                {needsApproval && (
                  <Key size={9} strokeWidth={2} color="var(--color-warning)" />
                )}
              </div>

              {/* Label */}
              <div
                style={{
                  marginTop: 6,
                  textAlign: "center",
                  padding: "0 4px",
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: isCurrent ? 600 : 400,
                    color: isCompleted
                      ? "var(--color-text-secondary)"
                      : isCurrent
                      ? "var(--color-text-primary)"
                      : "var(--color-text-muted)",
                    margin: 0,
                    lineHeight: 1.3,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 80,
                  }}
                >
                  {stage.name}
                </p>
                {isCurrent && (
                  <span
                    style={{
                      fontSize: 9,
                      color: "var(--color-accent)",
                      fontWeight: 600,
                    }}
                  >
                    Current
                  </span>
                )}
                {needsApproval && (
                  <span
                    style={{
                      fontSize: 9,
                      color: "var(--color-warning)",
                      fontWeight: 600,
                    }}
                  >
                    Awaiting
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Placeholder tab ──────────────────────────────────────────────────────────

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 0",
        gap: 12,
        color: "var(--color-text-muted)",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "var(--radius-md)",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Layers size={20} strokeWidth={1} />
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 500 }}>
        {label} — coming soon
      </p>
    </div>
  );
}

// ─── Project Detail Page ──────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const params = useParams<{ firmSlug: string; projectId: string }>();
  const router = useRouter();
  const { user, firm } = useAuthStore();
  const { projects } = useProjectStore();
  const { users } = useFirmStore();
  const { tasks } = useTaskStore();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const project = projects.find((p) => p.id === params.projectId);

  if (!project || !user || !firm) {
    return (
      <div
        style={{
          padding: 28,
          color: "var(--color-text-muted)",
          fontSize: "var(--text-sm)",
        }}
      >
        Project not found.
      </div>
    );
  }

  // Task progress
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const doneTasks = projectTasks.filter(
    (t) => t.status === "done" || t.status === "approved"
  ).length;
  const taskProgress =
    projectTasks.length > 0
      ? Math.round((doneTasks / projectTasks.length) * 100)
      : 0;

  // Team
  const teamUsers = users.filter((u) => project.staffIds.includes(u.id));
  const teamLead = users.find((u) => u.id === project.teamLeadId);

  // Current stage
  const currentStage = project.stages.find((s) => s.id === project.currentStageId);

  // Deadline urgency
  const daysToDeadline = project.expectedEndDate
    ? differenceInDays(parseISO(project.expectedEndDate), new Date())
    : null;

  // On hold banner
  const isOnHold = project.status === "on_hold";

  // Visible tabs (filter admin-only)
  const visibleTabs = TABS.filter(
    (t) => !(t as any).adminOnly || user.role === "admin" || user.role === "accounts"
  );

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab project={project} />;
      case "tasks":
        return <TasksTab project={project} />;
      case "files":
        return <FilesTab project={project} />;
      case "meetings":
        return <MeetingsTab project={project} />;
      case "rfi":
        return <RfiTab project={project} />;
      case "punchlist":
        return <PunchListTab project={project} />;
      case "site-reports":
        return <SiteReportsTab project={project} />;
      case "change-requests":
        return <ChangeRequestsTab project={project} />;
      case "vo":
        return <VoTab project={project} />;
      case "finance":
        return <FinanceTab project={project} />;
      case "chat":
        return <ChatTab project={project} />;
      case "activity":
        return <ActivityTab project={project} />;
      default:
        return <PlaceholderTab label={TABS.find((t) => t.id === activeTab)?.label ?? activeTab} />;
    }
  };

  return (
    <>
      <style>{`
        @keyframes stagePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(229,82,48,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(229,82,48,0); }
        }
      `}</style>

      {/* On-hold banner */}
      {isOnHold && (
        <div
          style={{
            background: "rgba(217,160,58,0.1)",
            borderBottom: "1px solid rgba(217,160,58,0.3)",
            padding: "8px 28px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertTriangle size={14} strokeWidth={1.5} color="var(--color-warning)" />
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-warning)", fontWeight: 500 }}>
            Project on hold
          </span>
          {project.description && (
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              — {project.description}
            </span>
          )}
        </div>
      )}

      {/* Sticky header */}
      <div
        style={{
          position: "sticky",
          top: 52, // below topbar
          background: "var(--color-bg-canvas)",
          borderBottom: "1px solid var(--color-border)",
          zIndex: 9,
        }}
      >
        {/* Breadcrumb + header */}
        <div style={{ padding: "16px 28px 12px" }}>
          {/* Back */}
          <button
            onClick={() => router.push(`/${params.firmSlug}/projects`)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              fontSize: "var(--text-xs)",
              cursor: "pointer",
              padding: "0 0 8px",
              marginBottom: 4,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; }}
          >
            <ArrowLeft size={12} strokeWidth={2} /> Projects
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            {/* Left: name + meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1
                  style={{
                    fontSize: "clamp(16px, 2vw, 22px)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    margin: 0,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {project.name}
                </h1>
                <StatusBadge status={project.status} />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 6,
                  flexWrap: "wrap",
                }}
              >
                {/* Client */}
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                  {project.clientName}
                </span>

                <span style={{ color: "var(--color-border-strong)", fontSize: 12 }}>·</span>

                {/* Current stage */}
                {currentStage && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--color-accent)",
                        flexShrink: 0,
                      }}
                    />
                    {currentStage.name}
                  </span>
                )}

                <span style={{ color: "var(--color-border-strong)", fontSize: 12 }}>·</span>

                {/* Progress */}
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                  {taskProgress}% complete · {doneTasks}/{projectTasks.length} tasks
                </span>

                {/* Deadline */}
                {project.expectedEndDate && (
                  <>
                    <span style={{ color: "var(--color-border-strong)", fontSize: 12 }}>·</span>
                    <span
                      style={{
                        fontSize: "var(--text-sm)",
                        color:
                          daysToDeadline !== null && daysToDeadline < 0
                            ? "var(--color-destructive)"
                            : daysToDeadline !== null && daysToDeadline < 30
                            ? "var(--color-warning)"
                            : "var(--color-text-muted)",
                        fontWeight: daysToDeadline !== null && daysToDeadline < 30 ? 500 : 400,
                      }}
                    >
                      Due {format(parseISO(project.expectedEndDate), "d MMM yyyy")}
                      {daysToDeadline !== null &&
                        daysToDeadline < 0 &&
                        ` (${Math.abs(daysToDeadline)}d overdue)`}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right: team avatars + fee */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 6,
                flexShrink: 0,
              }}
            >
              <AvatarGroup
                names={teamUsers.map((u) => u.name)}
                colors={teamUsers.map((u) => u.avatarColor)}
                size="sm"
                max={5}
              />
              {project.feeAgreed && (
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  ₹{(project.feeAgreed / 100000).toFixed(1)} L
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stage timeline */}
        <StageTimeline project={project} />

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 28px",
            gap: 0,
            overflowX: "auto",
          }}
        >
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as TabId)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 14px",
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${isActive ? "var(--color-accent)" : "transparent"}`,
                  color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  fontSize: "var(--text-sm)",
                  fontWeight: isActive ? 500 : 400,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all var(--duration-fast)",
                  marginBottom: -1,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = "var(--color-text-muted)";
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: "24px 28px", minHeight: 400 }}>{renderTab()}</div>
    </>
  );
}
