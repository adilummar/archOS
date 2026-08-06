"use client";
/**
 * Dashboard — firm portal main page.
 * Phase 3: greeting, quick stats, today's work, upcoming, pending approvals,
 *           recent activity, unresponded RFIs, leave alerts.
 * Task 3.1–3.6
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, isToday, isTomorrow, differenceInDays, parseISO } from "date-fns";
import {
  FolderKanban,
  CheckSquare,
  Clock,
  Users,
  AlertCircle,
  ChevronRight,
  CalendarOff,
  MessageSquare,
  CheckCircle2,
  Play,
  Square,
  Circle,
  Loader2,
  Activity,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useTaskStore } from "@/lib/store/task.store";
import { useTimeStore } from "@/lib/store/time.store";
import { useLeaveStore } from "@/lib/store/leave.store";
import { useRfiStore } from "@/lib/store/rfi.store";
import { useActivityStore } from "@/lib/store/activity.store";
import { useNotificationStore } from "@/lib/store/notification.store";
import { toast } from "@/lib/store/toast.store";
import { Avatar } from "@/components/shared/Avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Task, Project } from "@/lib/store/types";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ height, width = "100%" }: { height: number; width?: string | number }) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: "var(--radius-sm)",
        background: "var(--color-bg-card)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, transparent 0%, var(--color-bg-card-hover) 50%, transparent 100%)",
          animation: "shimmer 1.5s infinite",
        }}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 24 }}>
      <SkeletonBlock height={72} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[0, 1, 2, 3].map((i) => <SkeletonBlock key={i} height={88} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SkeletonBlock height={320} />
        <SkeletonBlock height={320} />
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: `1px solid ${accent ? "var(--color-accent-strong)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-md)",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: accent ? "var(--color-accent)" : "var(--color-text-muted)",
        }}
      >
        {icon}
        {accent && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
              background: "var(--color-accent-muted)",
              padding: "2px 6px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            Alert
          </span>
        )}
      </div>
      <div>
        <p
          style={{
            fontSize: 28,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            color: accent ? "var(--color-accent)" : "var(--color-text-primary)",
            margin: 0,
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          {value}
        </p>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
          {label}
        </p>
        {sub && (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "2px 0 0" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, project }: { task: Task; project?: Project }) {
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "done" && task.status !== "approved";
  const isDueToday = isToday(parseISO(task.dueDate));

  const priorityColors: Record<string, string> = {
    urgent: "var(--color-destructive)",
    high: "var(--color-accent)",
    medium: "var(--color-warning)",
    low: "var(--color-text-muted)",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        borderRadius: "var(--radius-sm)",
        borderLeft: isOverdue ? "2px solid var(--color-destructive)" : "2px solid transparent",
        background: "transparent",
        transition: "background var(--duration-fast)",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "var(--color-bg-card-hover)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      {/* Priority dot */}
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: priorityColors[task.priority] ?? "var(--color-text-muted)",
          flexShrink: 0,
        }}
      />
      {/* Project chip */}
      {project && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: "var(--color-text-muted)",
            background: "var(--color-bg-input)",
            padding: "2px 7px",
            borderRadius: "var(--radius-sm)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 120,
            flexShrink: 0,
          }}
        >
          {project.name.split("—")[0].trim()}
        </span>
      )}
      {/* Task title */}
      <span
        style={{
          flex: 1,
          fontSize: "var(--text-sm)",
          color: "var(--color-text-secondary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {task.title}
      </span>
      {/* Due date */}
      <span
        style={{
          fontSize: "var(--text-xs)",
          fontFamily: "var(--font-mono)",
          color: isOverdue
            ? "var(--color-destructive)"
            : isDueToday
            ? "var(--color-warning)"
            : "var(--color-text-muted)",
          flexShrink: 0,
        }}
      >
        {isOverdue
          ? `${Math.abs(differenceInDays(parseISO(task.dueDate), new Date()))}d overdue`
          : isDueToday
          ? "Today"
          : format(parseISO(task.dueDate), "d MMM")}
      </span>
      {/* Status badge */}
      <StatusBadge status={task.status} />
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, count, href }: { title: string; count?: number; href?: string }) {
  const router = useRouter();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h2
          style={{
            fontSize: "var(--text-base)",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {count !== undefined && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-text-muted)",
              background: "var(--color-bg-input)",
              padding: "1px 7px",
              borderRadius: 10,
            }}
          >
            {count}
          </span>
        )}
      </div>
      {href && (
        <button
          onClick={() => router.push(href)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            color: "var(--color-text-muted)",
            fontSize: "var(--text-xs)",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: "var(--radius-sm)",
            transition: "all var(--duration-fast)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-accent)";
            e.currentTarget.style.background = "var(--color-accent-muted)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-text-muted)";
            e.currentTarget.style.background = "none";
          }}
        >
          See all <ChevronRight size={12} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "18px 20px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Active Clock-In Widget ───────────────────────────────────────────────────

function ClockWidget() {
  const { user, firm } = useAuthStore();
  const { projects } = useProjectStore();
  const { activeSessions, startClock, stopClock } = useTimeStore();
  const [elapsed, setElapsed] = useState("00:00:00");
  const [selectedProject, setSelectedProject] = useState("");

  const myProjects = projects.filter(
    (p) => p.firmId === firm?.id && p.status === "active" && (p.staffIds.includes(user?.id ?? "") || p.teamLeadId === user?.id)
  );

  const activeSession = activeSessions.find((s) => s.userId === user?.id) ?? null;
  // Tick
  useEffect(() => {
    if (!activeSession) return;
    const tick = () => {
      const start = new Date(activeSession.startTime);
      const now = new Date();
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
      const s = String(diff % 60).padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  const handleStart = () => {
    if (!selectedProject || !user || !firm) return;
    const proj = myProjects.find((p) => p.id === selectedProject);
    if (!proj) return;
    const ok = startClock({
      userId: user.id,
      firmId: firm.id,
      projectId: proj.id,
      phase: proj.stages.find((s) => s.id === proj.currentStageId)?.name ?? "General",
    });
    if (ok) toast(`Clock started — ${proj.name.split("—")[0].trim()}`, "success");
    else toast("You already have an active session", "warning");
  };

  const handleStop = () => {
    if (!user || !firm) return;
    stopClock(user.id, firm.id);
    toast("Time logged successfully", "success");
  };

  const activeProject = activeSession
    ? myProjects.find((p) => p.id === activeSession.projectId)
    : null;

  return (
    <Card>
      <SectionHeader title="Time Tracker" href={`/${firm?.id?.replace("firm-", "")}/time`} />
      {activeSession ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 16px",
              background: "var(--color-accent-muted)",
              border: "1px solid var(--color-accent-strong)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--color-accent)",
                animation: "pulse 1.5s infinite",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", margin: 0, fontWeight: 500 }}>
                Recording
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)", margin: 0 }}>
                {activeProject?.name.split("—")[0].trim() ?? "Project"}
              </p>
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xl)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                letterSpacing: "0.05em",
              }}
            >
              {elapsed}
            </span>
          </div>
          <button
            id="clock-stop-btn"
            onClick={handleStop}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "9px",
              borderRadius: "var(--radius-sm)",
              background: "transparent",
              border: "1px solid var(--color-destructive)",
              color: "var(--color-destructive)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all var(--duration-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(220,50,40,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Square size={14} strokeWidth={2} />
            Stop & Log
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <select
            id="clock-project-select"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-bg-input)",
              border: "1px solid var(--color-border)",
              color: selectedProject ? "var(--color-text-primary)" : "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              cursor: "pointer",
              width: "100%",
            }}
          >
            <option value="">Select a project…</option>
            {myProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name.split("—")[0].trim()}
              </option>
            ))}
          </select>
          <button
            id="clock-start-btn"
            onClick={handleStart}
            disabled={!selectedProject}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "9px",
              borderRadius: "var(--radius-sm)",
              background: selectedProject ? "var(--color-accent)" : "var(--color-bg-input)",
              border: "none",
              color: selectedProject ? "var(--color-text-inverse)" : "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              cursor: selectedProject ? "pointer" : "not-allowed",
              transition: "all var(--duration-fast)",
            }}
            onMouseEnter={(e) => {
              if (selectedProject) e.currentTarget.style.background = "var(--color-accent-hover)";
            }}
            onMouseLeave={(e) => {
              if (selectedProject) e.currentTarget.style.background = "var(--color-accent)";
            }}
          >
            <Play size={14} strokeWidth={2} />
            Start Clock
          </button>
        </div>
      )}
    </Card>
  );
}

// ─── Project Health Snapshot (admin only) ─────────────────────────────────────

function ProjectHealthCard({ project }: { project: Project }) {
  const { tasks } = useTaskStore();
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const doneTasks = projectTasks.filter((t) => t.status === "done" || t.status === "approved").length;
  const progress = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;
  const overdueTasks = projectTasks.filter(
    (t) => new Date(t.dueDate) < new Date() && t.status !== "done" && t.status !== "approved"
  ).length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "12px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--color-border)",
        background: "transparent",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <p
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            color: "var(--color-text-primary)",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {project.name.split("—")[0].trim()}
        </p>
        <StatusBadge status={project.status} />
      </div>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>
        {project.clientName}
      </p>
      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            flex: 1,
            height: 4,
            background: "var(--color-bg-input)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: progress === 100 ? "var(--color-success)" : "var(--color-accent)",
              borderRadius: 2,
              transition: "width 0.5s var(--ease-out)",
            }}
          />
        </div>
        <span
          style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            color: "var(--color-text-muted)",
            flexShrink: 0,
          }}
        >
          {progress}%
        </span>
        {overdueTasks > 0 && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--color-destructive)",
              flexShrink: 0,
            }}
          >
            {overdueTasks} overdue
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const params = useParams<{ firmSlug: string }>();
  const router = useRouter();
  const { user, firm } = useAuthStore();
  const { projects } = useProjectStore();
  const { tasks } = useTaskStore();
  const { requests: leaveRequests } = useLeaveStore();
  const { rfis } = useRfiStore();
  const { logs: activityLogs } = useActivityStore();
  const { notifications } = useNotificationStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (!user || !firm) return null;

  const firmId = firm.id;

  // Today's tasks — assigned to me, not done
  const todaysTasks = tasks.filter(
    (t) =>
      t.firmId === firmId &&
      t.assigneeId === user.id &&
      isToday(parseISO(t.dueDate)) &&
      t.status !== "done" &&
      t.status !== "approved"
  );

  // Overdue tasks — mine
  const overdueTasks = tasks.filter(
    (t) =>
      t.firmId === firmId &&
      t.assigneeId === user.id &&
      new Date(t.dueDate) < new Date() &&
      !isToday(parseISO(t.dueDate)) &&
      t.status !== "done" &&
      t.status !== "approved"
  );

  // All active tasks assigned to me
  const myOpenTasks = tasks.filter(
    (t) => t.firmId === firmId && t.assigneeId === user.id && t.status !== "done" && t.status !== "approved"
  );

  // Active projects
  const activeProjects = projects.filter((p) => p.firmId === firmId && p.status === "active");

  // Pending leaves (admin only)
  const pendingLeaves = leaveRequests.filter((l) => l.firmId === firmId && l.status === "pending");

  // Unresponded RFIs older than 3 days
  const urgentRFIs = rfis.filter(
    (r) =>
      r.firmId === firmId &&
      r.status === "open" &&
      differenceInDays(new Date(), parseISO(r.createdAt)) >= 3
  );

  // Upcoming tasks (next 7 days, not today)
  const upcomingTasks = tasks.filter(
    (t) =>
      t.firmId === firmId &&
      t.assigneeId === user.id &&
      !isToday(parseISO(t.dueDate)) &&
      differenceInDays(parseISO(t.dueDate), new Date()) > 0 &&
      differenceInDays(parseISO(t.dueDate), new Date()) <= 7 &&
      t.status !== "done" &&
      t.status !== "approved"
  );

  // Recent activity
  const recentActivity = activityLogs
    .filter((a) => a.firmId === firmId)
    .slice(-8)
    .reverse();

  // Client approvals pending (projects where current stage needs approval)
  const pendingApprovals = projects.filter(
    (p) =>
      p.firmId === firmId &&
      p.status === "active" &&
      p.stages.some((s) => s.clientApprovalStatus === "pending" && s.clientApprovalRequestedAt)
  );

  const getProjectForTask = (task: Task) => projects.find((p) => p.id === task.projectId);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (!ready) return <DashboardSkeleton />;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 24, maxWidth: 1400 }}>

        {/* ── Greeting ── */}
        <div>
          <h1
            style={{
              fontSize: "clamp(20px, 2.5vw, 28px)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
              letterSpacing: "-0.03em",
            }}
          >
            {greeting()}, {user.name.split(" ")[0]}
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {format(new Date(), "EEEE, d MMMM yyyy")} · {firm.name}
          </p>
        </div>

        {/* ── Quick stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <StatCard
            label="Active Projects"
            value={activeProjects.length}
            icon={<FolderKanban size={18} strokeWidth={1.5} />}
          />
          <StatCard
            label="Open Tasks"
            value={myOpenTasks.length}
            icon={<CheckSquare size={18} strokeWidth={1.5} />}
            sub={`${todaysTasks.length} due today`}
          />
          <StatCard
            label="Overdue Tasks"
            value={overdueTasks.length}
            icon={<AlertCircle size={18} strokeWidth={1.5} />}
            accent={overdueTasks.length > 0}
          />
          {user.role === "admin" || user.role === "team_lead" ? (
            <StatCard
              label="Pending Approvals"
              value={pendingApprovals.length + pendingLeaves.length}
              icon={<Clock size={18} strokeWidth={1.5} />}
              accent={(pendingApprovals.length + pendingLeaves.length) > 0}
            />
          ) : (
            <StatCard
              label="Unread Notifications"
              value={notifications.filter((n) => !n.read && n.userId === user.id && n.firmId === firmId).length}
              icon={<Activity size={18} strokeWidth={1.5} />}
            />
          )}
        </div>

        {/* ── Main 2-column grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Overdue — surfaced above today */}
            {overdueTasks.length > 0 && (
              <Card style={{ borderColor: "var(--color-destructive)", borderWidth: 1 }}>
                <SectionHeader
                  title="Overdue"
                  count={overdueTasks.length}
                  href={`/${params.firmSlug}/tasks`}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {overdueTasks.slice(0, 5).map((t) => (
                    <TaskRow key={t.id} task={t} project={getProjectForTask(t)} />
                  ))}
                </div>
              </Card>
            )}

            {/* Today's work */}
            <Card>
              <SectionHeader
                title="Today's Work"
                count={todaysTasks.length}
                href={`/${params.firmSlug}/tasks`}
              />
              {todaysTasks.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "32px 0",
                    gap: 8,
                    color: "var(--color-text-muted)",
                  }}
                >
                  <CheckCircle2 size={32} strokeWidth={1} />
                  <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>
                    Nothing due today — enjoy the calm.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {todaysTasks.map((t) => (
                    <TaskRow key={t.id} task={t} project={getProjectForTask(t)} />
                  ))}
                </div>
              )}
            </Card>

            {/* Upcoming — next 7 days */}
            {upcomingTasks.length > 0 && (
              <Card>
                <SectionHeader
                  title="Upcoming (7 days)"
                  count={upcomingTasks.length}
                  href={`/${params.firmSlug}/tasks`}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {upcomingTasks.slice(0, 6).map((t) => (
                    <TaskRow key={t.id} task={t} project={getProjectForTask(t)} />
                  ))}
                </div>
              </Card>
            )}

            {/* Pending approvals — client stage gates */}
            {pendingApprovals.length > 0 && (
              <Card style={{ borderColor: "var(--color-warning)" }}>
                <SectionHeader
                  title="Awaiting Client Approval"
                  count={pendingApprovals.length}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pendingApprovals.map((proj) => {
                    const pendingStage = proj.stages.find(
                      (s) => s.clientApprovalStatus === "pending"
                    );
                    const daysWaiting = pendingStage?.clientApprovalRequestedAt
                      ? differenceInDays(new Date(), parseISO(pendingStage.clientApprovalRequestedAt))
                      : 0;
                    return (
                      <div
                        key={proj.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 12px",
                          background: "var(--color-bg-input)",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              fontSize: "var(--text-sm)",
                              fontWeight: 500,
                              color: "var(--color-text-primary)",
                              margin: 0,
                            }}
                          >
                            {proj.name.split("—")[0].trim()}
                          </p>
                          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "2px 0 0" }}>
                            {pendingStage?.name} · {proj.clientName} ·{" "}
                            <span style={{ color: daysWaiting > 3 ? "var(--color-warning)" : "inherit" }}>
                              {daysWaiting}d waiting
                            </span>
                          </p>
                        </div>
                        <ChevronRight size={14} strokeWidth={1.5} color="var(--color-text-muted)" />
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Unresponded RFIs alert */}
            {urgentRFIs.length > 0 && (
              <Card style={{ borderColor: "var(--color-warning)" }}>
                <SectionHeader
                  title="Unresponded RFIs"
                  count={urgentRFIs.length}
                  href={`/${params.firmSlug}/rfi`}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {urgentRFIs.map((rfi) => {
                    const proj = projects.find((p) => p.id === rfi.projectId);
                    const days = differenceInDays(new Date(), parseISO(rfi.createdAt));
                    return (
                      <div
                        key={rfi.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 12px",
                          background: "var(--color-bg-input)",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                        }}
                        onClick={() => router.push(`/${params.firmSlug}/rfi`)}
                      >
                        <MessageSquare size={14} strokeWidth={1.5} style={{ color: "var(--color-warning)", flexShrink: 0 }} />
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <p
                            style={{
                              fontSize: "var(--text-sm)",
                              color: "var(--color-text-primary)",
                              margin: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {rfi.rfiNumber} — {rfi.title}
                          </p>
                          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "1px 0 0" }}>
                            {proj?.name.split("—")[0].trim()} · {rfi.raiserName} · {days}d open
                          </p>
                        </div>
                        <StatusBadge status={rfi.priority} />
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Leave alerts (admin only) */}
            {user.role === "admin" && pendingLeaves.length > 0 && (
              <Card>
                <SectionHeader
                  title="Leave Requests"
                  count={pendingLeaves.length}
                  href={`/${params.firmSlug}/leave`}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {pendingLeaves.map((leave) => {
                    const { users } = useFirmStore.getState();
                    const leaveUser = users.find((u) => u.id === leave.userId);
                    return (
                      <div
                        key={leave.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 12px",
                          background: "var(--color-bg-input)",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        {leaveUser && (
                          <Avatar
                            name={leaveUser.name}
                            color={leaveUser.avatarColor}
                            initials={leaveUser.avatarInitials}
                            size="sm"
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>
                            {leave.userName}
                          </p>
                          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "1px 0 0" }}>
                            {format(parseISO(leave.startDate), "d MMM")} – {format(parseISO(leave.endDate), "d MMM")} · {leave.days} days
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => {
                              useLeaveStore.getState().approve(leave.id, user.id);
                              toast(`Leave approved for ${leave.userName}`, "success");
                            }}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "var(--radius-sm)",
                              background: "rgba(80,160,64,0.1)",
                              border: "1px solid rgba(80,160,64,0.3)",
                              color: "var(--color-success)",
                              fontSize: "var(--text-xs)",
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              useLeaveStore.getState().reject(leave.id, user.id, "Declined from dashboard");
                              toast(`Leave rejected for ${leave.userName}`, "error");
                            }}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "var(--radius-sm)",
                              background: "transparent",
                              border: "1px solid var(--color-border-strong)",
                              color: "var(--color-text-muted)",
                              fontSize: "var(--text-xs)",
                              cursor: "pointer",
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <Card>
                <SectionHeader title="Recent Activity" />
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {recentActivity.map((log, i) => (
                    <div
                      key={log.id}
                      style={{
                        display: "flex",
                        gap: 12,
                        padding: "8px 0",
                        borderBottom:
                          i < recentActivity.length - 1
                            ? "1px solid var(--color-border)"
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "var(--color-border-strong)",
                          flexShrink: 0,
                          marginTop: 6,
                        }}
                      />
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <p
                          style={{
                            fontSize: "var(--text-sm)",
                            color: "var(--color-text-secondary)",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {log.description}
                        </p>
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "1px 0 0" }}>
                          {log.userName} · {format(parseISO(log.createdAt), "d MMM, HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Clock widget */}
            <ClockWidget />

            {/* Project health (admin + team lead) */}
            {(user.role === "admin" || user.role === "team_lead") && (
              <Card>
                <SectionHeader
                  title="Project Health"
                  href={`/${params.firmSlug}/projects`}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {activeProjects.slice(0, 5).map((p) => (
                    <ProjectHealthCard key={p.id} project={p} />
                  ))}
                  {activeProjects.length === 0 && (
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textAlign: "center", padding: "24px 0" }}>
                      No active projects found.
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Quick nav */}
            <Card>
              <SectionHeader title="Quick Access" />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  { label: "All Projects", href: `/${params.firmSlug}/projects`, icon: <FolderKanban size={14} strokeWidth={1.5} /> },
                  { label: "My Tasks", href: `/${params.firmSlug}/tasks`, icon: <CheckSquare size={14} strokeWidth={1.5} /> },
                  { label: "Time Tracker", href: `/${params.firmSlug}/time`, icon: <Clock size={14} strokeWidth={1.5} /> },
                  { label: "Leave", href: `/${params.firmSlug}/leave`, icon: <CalendarOff size={14} strokeWidth={1.5} /> },
                  ...(user.role === "admin" || user.role === "accounts"
                    ? [{ label: "Finance", href: `/${params.firmSlug}/finance`, icon: <DollarSign size={14} strokeWidth={1.5} /> }]
                    : []),
                  { label: "CRM", href: `/${params.firmSlug}/crm`, icon: <TrendingUp size={14} strokeWidth={1.5} /> },
                ].map((item) => (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      background: "transparent",
                      border: "none",
                      color: "var(--color-text-muted)",
                      fontSize: "var(--text-sm)",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
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
                    {item.icon}
                    {item.label}
                    <ChevronRight size={12} strokeWidth={1.5} style={{ marginLeft: "auto" }} />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
