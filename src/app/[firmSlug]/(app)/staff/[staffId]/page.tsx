"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth.store";
import { useStaffProfile } from "@/hooks/useStaff";
import { useLeaveMutations } from "@/hooks/useLeave";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "@/lib/store/toast.store";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
} from "date-fns";
import { getTimeInTimezone, isCheckInLate } from "@/lib/timezone";

type ProfileTab = "overview" | "tasks" | "projects" | "attendance";

function formatMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function StaffDetailPage() {
  const params = useParams<{ firmSlug: string; staffId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser, firm } = useAuthStore();
  const firmId = firm?.id || "";
  const staffId = params.staffId;

  // Active Tab synchronized with ?tab= query param
  const rawTab = searchParams.get("tab") as ProfileTab | null;
  const initialTab: ProfileTab =
    rawTab === "tasks" || rawTab === "projects" || rawTab === "attendance"
      ? rawTab
      : "overview";

  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);

  const switchTab = (tab: ProfileTab) => {
    setActiveTab(tab);
    router.replace(`/${params.firmSlug}/staff/${staffId}?tab=${tab}`, { scroll: false });
  };

  // Queries
  const { data: profile, isLoading, error } = useStaffProfile(firmId, staffId);
  const { data: firmTasks = [] } = useTasks(firmId);
  const leaveMutations = useLeaveMutations(firmId);

  // Tab 2 (Tasks) Filter
  const [taskFilter, setTaskFilter] = useState<"all" | "in_progress" | "overdue" | "done">("all");

  // Tab 3 (Projects) Filter
  const [projectFilter, setProjectFilter] = useState<"all" | "active" | "on_hold">("all");

  // Tab 4 (Attendance & Leave Request) Form State
  const [leaveType, setLeaveType] = useState("Casual leave");
  const [leaveFrom, setLeaveFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [leaveTo, setLeaveTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [leaveReason, setLeaveReason] = useState("");
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Derived user details
  const staffUser = profile?.user;
  const attendanceSessions = profile?.attendance || [];
  const todaySession = profile?.todaySession;
  const profileTasks = profile?.tasks || [];
  const recentLogs = profile?.recentLogs || [];
  const approvedLeaves = profile?.approvedLeaves || [];
  const allLeaveRequests = profile?.allLeaveRequests || [];
  const stats = profile?.stats || {
    presentDays: 0,
    totalWorkMinutes: 0,
    avgDailyMinutes: 0,
    totalDone: 0,
    totalPending: 0,
    totalLeaveDaysThisYear: 0,
    annualQuota: 21,
    leaveBalance: 21,
    workload: 0,
  };

  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const firmPolicy = profile?.firmPolicy || (firm as any);
  const firmTimezone = firmPolicy?.timezone || (firm as any)?.timezone || "Asia/Kolkata";
  const firmOfficeStartTime = firmPolicy?.officeStartTime || (firm as any)?.officeStartTime || "09:15";

  // Attendance status calculation
  const statusInfo = useMemo(() => {
    const hasApprovedLeave = approvedLeaves.some(
      (l: any) => l.startDate <= todayStr && l.endDate >= todayStr
    );
    if (hasApprovedLeave) {
      return { label: "Absent · Leave", color: "#F0626B" };
    }
    if (todaySession && todaySession.checkInTime) {
      const isLate = isCheckInLate(todaySession.checkInTime, firmOfficeStartTime, firmTimezone);
      if (isLate) {
        return { label: "Late", color: "#F2B544" };
      }
      return { label: "Present", color: "#3DD68C" };
    }
    return { label: "Absent", color: "#F0626B" };
  }, [approvedLeaves, todaySession, todayStr, firmOfficeStartTime, firmTimezone]);

  // Working on now
  const workingOnNow = useMemo(() => {
    if (todaySession && todaySession.currentTaskId) {
      const t = firmTasks.find((item: any) => item.id === todaySession.currentTaskId);
      const p = staffUser?.projectStaff?.find((ps: any) => ps.project.id === todaySession.currentProjectId)?.project;
      return {
        task: t?.title || todaySession.currentTaskId,
        project: p?.name || "Project",
      };
    }
    if (profileTasks.length > 0) {
      const first = profileTasks[0];
      return {
        task: first.title,
        project: first.project?.name || "Project",
      };
    }
    return null;
  }, [todaySession, firmTasks, staffUser, profileTasks]);

  // Projects list
  const staffProjects = useMemo(() => {
    if (!staffUser?.projectStaff) return [];
    return staffUser.projectStaff.map((ps: any) => {
      const p = ps.project;
      const pTasks = p.tasks || [];
      const doneCount = pTasks.filter((t: any) => t.status === "done").length;
      const totalCount = pTasks.length || 1;
      const progress = Math.round((doneCount / totalCount) * 100);
      const stages = p.stages || [];
      const currentStage = stages[0]?.name || "Concept & Planning";
      const nextTask = pTasks.find((t: any) => t.status !== "done" && t.dueDate);

      return {
        id: p.id,
        name: p.name,
        status: p.status || "active",
        role: staffUser.designation || staffUser.role.replace("_", " "),
        progress,
        currentStage,
        totalTasks: pTasks.length,
        nextDeadline: nextTask?.dueDate ? format(parseISO(nextTask.dueDate), "MMM d") : null,
        nextTaskTitle: nextTask?.title || "Milestone Review",
      };
    });
  }, [staffUser]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    if (projectFilter === "all") return staffProjects;
    return staffProjects.filter((p: any) => p.status === projectFilter);
  }, [staffProjects, projectFilter]);

  // Tasks with milestone grouping
  const filteredTasks = useMemo(() => {
    const now = new Date();
    return profileTasks.filter((t: any) => {
      const isOverdue = t.status !== "done" && t.dueDate && parseISO(t.dueDate) < now;
      if (taskFilter === "all") return true;
      if (taskFilter === "in_progress") return t.status === "in_progress" || t.status === "active";
      if (taskFilter === "overdue") return isOverdue;
      if (taskFilter === "done") return t.status === "done";
      return true;
    });
  }, [profileTasks, taskFilter]);

  // Milestone groups for Tasks tab
  const milestoneGroups = useMemo(() => {
    const groups: Record<string, { name: string; project: string; dueDate?: string; tasks: any[] }> = {};
    for (const t of filteredTasks) {
      const key = `${t.project?.name || "Project"} - ${t.stage?.name || "Tasks"}`;
      if (!groups[key]) {
        groups[key] = {
          name: t.stage?.name || "General Tasks",
          project: t.project?.name || "Project",
          dueDate: t.dueDate,
          tasks: [],
        };
      }
      groups[key].tasks.push(t);
    }
    return Object.values(groups);
  }, [filteredTasks]);

  // Calendar month matrix for Overview tab
  const calendarData = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const days = eachDayOfInterval({ start, end });
    const dayOfWeek = start.getDay();
    const emptyCount = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    return {
      monthLabel: format(now, "MMMM yyyy"),
      emptyCount,
      days: days.map((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        const isTodayCell = isSameDay(d, now);
        // Find tasks due or active on this day
        const dayTasks = profileTasks.filter((t: any) => t.dueDate && t.dueDate.startsWith(dateStr));
        const dayLeave = approvedLeaves.some((l: any) => l.startDate <= dateStr && l.endDate >= dateStr);
        const dayAttendance = attendanceSessions.find((a: any) => a.date === dateStr);

        return {
          dayNum: format(d, "d"),
          isTodayCell,
          tasks: dayTasks,
          hasLeave: dayLeave,
          hasAttendance: Boolean(dayAttendance),
        };
      }),
    };
  }, [profileTasks, approvedLeaves, attendanceSessions]);

  // Clash check for Leave Request form
  const clashesFound = useMemo(() => {
    if (!leaveFrom || !leaveTo) return [];
    try {
      const start = parseISO(leaveFrom);
      const end = parseISO(leaveTo);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];
      return profileTasks.filter((t: any) => {
        if (!t.dueDate || t.status === "done") return false;
        try {
          const taskDate = parseISO(t.dueDate);
          return isWithinInterval(taskDate, { start, end }) || isSameDay(taskDate, start) || isSameDay(taskDate, end);
        } catch {
          return false;
        }
      });
    } catch {
      return [];
    }
  }, [leaveFrom, leaveTo, profileTasks]);

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveFrom || !leaveTo) {
      toast("Please specify leave dates", "error");
      return;
    }
    setSubmittingLeave(true);
    try {
      await leaveMutations.createLeave.mutateAsync({
        type: leaveType.toLowerCase().replace(" leave", ""),
        startDate: leaveFrom,
        endDate: leaveTo,
        reason: leaveReason || "Personal leave request",
      });
      toast("Leave request submitted successfully", "success");
      setLeaveReason("");
    } catch (err: any) {
      toast(err.message || "Failed to submit leave request", "error");
    } finally {
      setSubmittingLeave(false);
    }
  };

  if (isLoading) {
    return (
      <div className="staff-root">
        <div className="staff-card" style={{ padding: 40, textAlign: "center", color: "var(--staff-text-muted)" }}>
          Loading staff profile...
        </div>
      </div>
    );
  }

  if (error || !staffUser) {
    return (
      <div className="staff-root">
        <div className="staff-card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ color: "var(--staff-danger)", fontSize: 16, fontWeight: 600 }}>Staff member not found</div>
          <p className="staff-muted" style={{ margin: "8px 0 16px" }}>The requested staff profile does not exist or you do not have permission to view it.</p>
          <button className="staff-btn-secondary" onClick={() => router.push(`/${params.firmSlug}/staff`)}>
            Back to Staff list
          </button>
        </div>
      </div>
    );
  }

  const workloadVal = stats.workload || (stats.totalPending > 0 ? Math.min(95, stats.totalPending * 20) : 0);

  return (
    <div className="staff-root">
      {/* Breadcrumb */}
      <div
        className="staff-muted"
        style={{ fontSize: 12, marginBottom: 14, cursor: "pointer" }}
        onClick={() => router.push(`/${params.firmSlug}/staff`)}
      >
        Staff / {staffUser.name}
      </div>

      {/* Profile Header Card */}
      <div
        className="staff-card staff-flex-row"
        style={{ padding: "20px 24px", gap: 20, marginBottom: 6, flexWrap: "wrap" }}
      >
        {/* Avatar */}
        <div
          className="staff-avatar"
          style={{
            width: 64,
            height: 64,
            fontSize: 20,
            background: staffUser.avatarColor || "var(--staff-border)",
          }}
        >
          {staffUser.avatarInitials || staffUser.name.slice(0, 2).toUpperCase()}
        </div>

        {/* Name and Current Task */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <div className="staff-flex-row" style={{ gap: 12 }}>
            <span style={{ fontSize: 22, fontWeight: 600, color: "var(--staff-text)" }}>{staffUser.name}</span>
            <span
              className="staff-pill"
              style={{
                color: statusInfo.color,
                borderColor: `${statusInfo.color}55`,
                background: `${statusInfo.color}14`,
              }}
            >
              ● {statusInfo.label}
            </span>
          </div>
          <div className="staff-muted" style={{ marginTop: 4, fontSize: 13 }}>
            <span style={{ textTransform: "capitalize" }}>{staffUser.designation || staffUser.role.replace("_", " ")}</span>
            {workingOnNow && (
              <>
                {" "}· Working on <span style={{ color: "var(--staff-text)" }}>{workingOnNow.task}</span> · {workingOnNow.project}
              </>
            )}
          </div>
        </div>

        {/* 4 Stats Grid */}
        <div className="staff-grid" style={{ gridTemplateColumns: "repeat(4, 110px)", gap: 12, textAlign: "right" }}>
          <div>
            <div className="staff-mono" style={{ fontSize: 22, color: "var(--staff-text)" }}>{workloadVal}%</div>
            <div className="staff-label-caps">Workload</div>
          </div>
          <div>
            <div className="staff-mono" style={{ fontSize: 22, color: "var(--staff-text)" }}>{stats.totalPending}</div>
            <div className="staff-label-caps">Open tasks</div>
          </div>
          <div>
            <div className="staff-mono" style={{ fontSize: 22, color: "var(--staff-text)" }}>{staffProjects.length}</div>
            <div className="staff-label-caps">Projects</div>
          </div>
          <div>
            <div className="staff-mono" style={{ fontSize: 22, color: "var(--staff-text)" }}>{stats.presentDays}</div>
            <div className="staff-label-caps">Days present</div>
          </div>
        </div>
      </div>

      {/* Profile Primary Tabs Row */}
      <div className="staff-flex-row" style={{ gap: 28, borderBottom: "1px solid var(--staff-border)", marginBottom: 20 }}>
        <div
          className={`staff-tab-item ${activeTab === "overview" ? "staff-tab-active" : ""}`}
          onClick={() => switchTab("overview")}
        >
          Overview
        </div>
        <div
          className={`staff-tab-item ${activeTab === "tasks" ? "staff-tab-active" : ""}`}
          onClick={() => switchTab("tasks")}
        >
          Tasks
        </div>
        <div
          className={`staff-tab-item ${activeTab === "projects" ? "staff-tab-active" : ""}`}
          onClick={() => switchTab("projects")}
        >
          Projects
        </div>
        <div
          className={`staff-tab-item ${activeTab === "attendance" ? "staff-tab-active" : ""}`}
          onClick={() => switchTab("attendance")}
        >
          Attendance
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 2 · TAB: OVERVIEW                                                  */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="staff-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
          {/* Left Column: Logs */}
          <div className="staff-grid" style={{ gap: 20, alignContent: "start" }}>
            {/* Activity Log */}
            <div className="staff-card" style={{ padding: "18px 20px" }}>
              <div className="staff-label-caps" style={{ marginBottom: 6 }}>Activity log</div>
              {recentLogs.length === 0 ? (
                <div className="staff-muted" style={{ padding: "14px 0", fontSize: 13 }}>No recent activity recorded.</div>
              ) : (
                recentLogs.map((log: any) => (
                  <div key={log.id} className="staff-log-item">
                    <span className="staff-mono staff-muted" style={{ width: 64, flex: "none", fontSize: 12 }}>
                      {format(new Date(log.createdAt), "HH:mm")}
                    </span>
                    <div>
                      <b>{log.description || log.action}</b>
                      <div className="staff-muted" style={{ fontSize: 12 }}>
                        {log.project?.name || "Arch OS"} · {log.entity}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Site Visit Log */}
            <div className="staff-card" style={{ padding: "18px 20px" }}>
              <div className="staff-label-caps" style={{ marginBottom: 6 }}>Site visit log</div>
              <div className="staff-muted" style={{ padding: "14px 0", fontSize: 13 }}>
                No site visits recorded for this staff member.
              </div>
            </div>

            {/* Meetings Log */}
            <div className="staff-card" style={{ padding: "18px 20px" }}>
              <div className="staff-label-caps" style={{ marginBottom: 6 }}>Meetings log</div>
              <div className="staff-muted" style={{ padding: "14px 0", fontSize: 13 }}>
                No meetings scheduled.
              </div>
            </div>
          </div>

          {/* Right Column: Monthly Work Calendar */}
          <div className="staff-card" style={{ padding: "18px 20px", alignSelf: "start" }}>
            <div className="staff-label-caps" style={{ marginBottom: 6 }}>
              Monthly work calendar · {calendarData.monthLabel}
            </div>

            {/* Legend */}
            <div className="staff-flex-row staff-muted" style={{ gap: 16, fontSize: 12, margin: "6px 0 14px", flexWrap: "wrap" }}>
              <span className="staff-flex-row" style={{ gap: 6 }}>
                <i style={{ width: 10, height: 10, borderRadius: 2, background: "var(--staff-info)" }} /> Drafting
              </span>
              <span className="staff-flex-row" style={{ gap: 6 }}>
                <i style={{ width: 10, height: 10, borderRadius: 2, background: "var(--staff-success)" }} /> Site visit
              </span>
              <span className="staff-flex-row" style={{ gap: 6 }}>
                <i style={{ width: 10, height: 10, borderRadius: 2, background: "var(--staff-meeting)" }} /> Meeting
              </span>
              <span className="staff-flex-row" style={{ gap: 6 }}>
                <i style={{ width: 10, height: 10, borderRadius: 2, background: "var(--staff-warning)" }} /> Submission
              </span>
              <span className="staff-flex-row" style={{ gap: 6 }}>
                <i style={{ width: 10, height: 10, borderRadius: 2, background: "var(--staff-neutral)" }} /> Leave
              </span>
            </div>

            {/* Calendar Grid */}
            <div className="staff-grid" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} className="staff-label-caps" style={{ textAlign: "center" }}>{d}</div>
              ))}

              {Array.from({ length: calendarData.emptyCount }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {calendarData.days.map((cd, i) => (
                <div
                  key={i}
                  className={`staff-cal-cell ${cd.isTodayCell ? "staff-cal-today" : ""}`}
                >
                  <span>{cd.dayNum}</span>
                  {cd.hasAttendance && <i style={{ background: "var(--staff-info)" }} />}
                  {cd.tasks.length > 0 && <i style={{ background: "var(--staff-warning)" }} />}
                  {cd.hasLeave && <i style={{ background: "var(--staff-neutral)" }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3 · TAB: TASKS                                                     */}
      {/* ========================================================================= */}
      {activeTab === "tasks" && (
        <div>
          {/* Filter Chips */}
          <div className="staff-flex-row" style={{ gap: 10, marginBottom: 16 }}>
            <span
              className="staff-pill"
              onClick={() => setTaskFilter("all")}
              style={{
                color: "var(--staff-text)",
                borderColor: taskFilter === "all" ? "var(--staff-accent)" : "rgba(230,233,238,0.33)",
                background: taskFilter === "all" ? "rgba(232,163,61,0.14)" : "rgba(230,233,238,0.08)",
                cursor: "pointer",
              }}
            >
              All {profileTasks.length}
            </span>

            <span
              className="staff-pill"
              onClick={() => setTaskFilter("in_progress")}
              style={{
                color: "var(--staff-info)",
                borderColor: taskFilter === "in_progress" ? "var(--staff-info)" : "rgba(91,157,255,0.33)",
                background: taskFilter === "in_progress" ? "rgba(91,157,255,0.2)" : "rgba(91,157,255,0.08)",
                cursor: "pointer",
              }}
            >
              In progress {profileTasks.filter((t: any) => t.status === "in_progress" || t.status === "active").length}
            </span>

            <span
              className="staff-pill"
              onClick={() => setTaskFilter("overdue")}
              style={{
                color: "var(--staff-danger)",
                borderColor: taskFilter === "overdue" ? "var(--staff-danger)" : "rgba(240,98,107,0.33)",
                background: taskFilter === "overdue" ? "rgba(240,98,107,0.2)" : "rgba(240,98,107,0.08)",
                cursor: "pointer",
              }}
            >
              Overdue {profileTasks.filter((t: any) => t.status !== "done" && t.dueDate && parseISO(t.dueDate) < new Date()).length}
            </span>

            <span
              className="staff-pill"
              onClick={() => setTaskFilter("done")}
              style={{
                color: "var(--staff-success)",
                borderColor: taskFilter === "done" ? "var(--staff-success)" : "rgba(61,214,140,0.33)",
                background: taskFilter === "done" ? "rgba(61,214,140,0.2)" : "rgba(61,214,140,0.08)",
                cursor: "pointer",
              }}
            >
              Done {profileTasks.filter((t: any) => t.status === "done").length}
            </span>
          </div>

          {/* Grouped Milestone Cards */}
          {milestoneGroups.length === 0 ? (
            <div className="staff-card" style={{ padding: 40, textAlign: "center", color: "var(--staff-text-muted)" }}>
              No tasks found matching this filter.
            </div>
          ) : (
            milestoneGroups.map((group, idx) => (
              <div key={idx} className="staff-card" style={{ marginBottom: 16, overflow: "hidden" }}>
                {/* Milestone Card Header */}
                <div className="staff-flex-row" style={{ justifyContent: "space-between", padding: "14px 20px" }}>
                  <b>{group.project} · {group.name}</b>
                  <span className="staff-muted" style={{ fontSize: 12 }}>
                    {group.tasks.length} task{group.tasks.length !== 1 ? "s" : ""}{group.dueDate ? ` · due ${format(parseISO(group.dueDate), "MMM d")}` : ""}
                  </span>
                </div>

                {/* Task Rows */}
                {group.tasks.map((task: any) => {
                  const isDone = task.status === "done";
                  const isOverdue = !isDone && task.dueDate && parseISO(task.dueDate) < new Date();
                  const priorityColor =
                    task.priority === "high" ? "var(--staff-danger)"
                    : task.priority === "medium" ? "var(--staff-warning)"
                    : "var(--staff-text-muted)";
                  const statusColor =
                    isDone ? "var(--staff-success)"
                    : isOverdue ? "var(--staff-danger)"
                    : "var(--staff-info)";
                  const statusLabel =
                    isDone ? "Done"
                    : isOverdue ? "Overdue"
                    : task.status === "in_progress" ? "In progress"
                    : "Assigned";
                  const pct = isDone ? 100 : task.status === "in_progress" ? 60 : 30;

                  return (
                    <div
                      key={task.id}
                      className="staff-grid"
                      style={{
                        gridTemplateColumns: "1fr 160px 100px 100px 130px 150px",
                        padding: "12px 20px",
                        borderTop: "1px solid var(--staff-border)",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>{task.title}</div>
                      <div className="staff-muted" style={{ fontSize: 12 }}>{task.project?.name || "Project"}</div>
                      <div className="staff-mono staff-muted" style={{ fontSize: 12 }}>
                        {task.dueDate ? format(parseISO(task.dueDate), "MMM d") : "—"}
                      </div>
                      <div>
                        <span
                          className="staff-pill"
                          style={{
                            color: priorityColor,
                            borderColor: `${priorityColor}55`,
                            background: `${priorityColor}14`,
                            textTransform: "capitalize",
                          }}
                        >
                          {task.priority || "Medium"}
                        </span>
                      </div>
                      <div>
                        <span
                          className="staff-pill"
                          style={{
                            color: statusColor,
                            borderColor: `${statusColor}55`,
                            background: `${statusColor}14`,
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <div className="staff-flex-row" style={{ gap: 8 }}>
                        <div className="staff-bar-track">
                          <i style={{ width: `${pct}%`, background: statusColor }} />
                        </div>
                        <span className="staff-mono staff-muted" style={{ fontSize: 12 }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4 · TAB: PROJECTS                                                  */}
      {/* ========================================================================= */}
      {activeTab === "projects" && (
        <div>
          {/* Filter Chips */}
          <div className="staff-flex-row" style={{ gap: 10, marginBottom: 16 }}>
            <span
              className="staff-pill"
              onClick={() => setProjectFilter("all")}
              style={{
                color: "var(--staff-text)",
                borderColor: projectFilter === "all" ? "var(--staff-accent)" : "rgba(230,233,238,0.33)",
                background: projectFilter === "all" ? "rgba(232,163,61,0.14)" : "rgba(230,233,238,0.08)",
                cursor: "pointer",
              }}
            >
              All {staffProjects.length}
            </span>

            <span
              className="staff-pill"
              onClick={() => setProjectFilter("active")}
              style={{
                color: "var(--staff-success)",
                borderColor: projectFilter === "active" ? "var(--staff-success)" : "rgba(61,214,140,0.33)",
                background: projectFilter === "active" ? "rgba(61,214,140,0.2)" : "rgba(61,214,140,0.08)",
                cursor: "pointer",
              }}
            >
              Active {staffProjects.filter((p: any) => p.status === "active").length}
            </span>

            <span
              className="staff-pill"
              onClick={() => setProjectFilter("on_hold")}
              style={{
                color: "var(--staff-text-muted)",
                borderColor: projectFilter === "on_hold" ? "var(--staff-text-muted)" : "rgba(154,164,178,0.33)",
                background: projectFilter === "on_hold" ? "rgba(154,164,178,0.2)" : "rgba(154,164,178,0.08)",
                cursor: "pointer",
              }}
            >
              On hold {staffProjects.filter((p: any) => p.status === "on_hold").length}
            </span>
          </div>

          {/* Projects Cards Grid */}
          {filteredProjects.length === 0 ? (
            <div className="staff-card" style={{ padding: 40, textAlign: "center", color: "var(--staff-text-muted)" }}>
              No projects found for this staff member.
            </div>
          ) : (
            <div className="staff-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {filteredProjects.map((p: any) => (
                <div key={p.id} className="staff-card" style={{ padding: "18px 20px" }}>
                  <div className="staff-label-caps" style={{ marginBottom: 8 }}>{p.name}</div>
                  <div className="staff-muted" style={{ marginBottom: 14 }}>{p.role}</div>

                  {/* Progress */}
                  <div className="staff-flex-row" style={{ gap: 10, marginBottom: 6 }}>
                    <div className="staff-bar-track">
                      <i style={{ width: `${p.progress}%`, background: "var(--staff-info)" }} />
                    </div>
                    <span className="staff-mono">{p.progress}%</span>
                  </div>

                  <div className="staff-muted" style={{ fontSize: 12, marginBottom: 16 }}>
                    {p.currentStage}
                  </div>

                  {/* 3 Stats Grid */}
                  <div
                    className="staff-grid"
                    style={{
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 8,
                      borderTop: "1px solid var(--staff-border)",
                      paddingTop: 14,
                    }}
                  >
                    <div>
                      <div className="staff-mono" style={{ fontSize: 18 }}>{p.totalTasks}</div>
                      <div className="staff-label-caps">Tasks</div>
                    </div>
                    <div>
                      <div className="staff-mono" style={{ fontSize: 18 }}>—</div>
                      <div className="staff-label-caps">Site visits</div>
                    </div>
                    <div>
                      <div className="staff-mono" style={{ fontSize: 18 }}>
                        {formatMinutes(stats.totalWorkMinutes)}
                      </div>
                      <div className="staff-label-caps">Hours</div>
                    </div>
                  </div>

                  {/* Next Deadline */}
                  {p.nextDeadline && (
                    <div style={{ marginTop: 14, fontSize: 13 }}>
                      <span
                        className="staff-pill"
                        style={{
                          color: "var(--staff-warning)",
                          borderColor: "rgba(242,181,68,0.33)",
                          background: "rgba(242,181,68,0.08)",
                          padding: "2px 8px",
                          fontSize: 11,
                        }}
                      >
                        Next
                      </span>{" "}
                      <span className="staff-muted">
                        {p.nextTaskTitle} · {p.nextDeadline}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 5 · TAB: ATTENDANCE + LEAVE REQUEST                                */}
      {/* ========================================================================= */}
      {activeTab === "attendance" && (
        <div className="staff-grid" style={{ gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>
          {/* Left Column: Summary Tiles and Daily Records */}
          <div className="staff-grid" style={{ gap: 20, alignContent: "start" }}>
            {/* 4 Summary Tiles */}
            <div className="staff-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <div className="staff-card" style={{ padding: "14px 18px" }}>
                <div className="staff-label-caps">Present</div>
                <div className="staff-mono" style={{ fontSize: 26, color: "var(--staff-success)", marginTop: 4 }}>
                  {stats.presentDays}
                </div>
              </div>

              <div className="staff-card" style={{ padding: "14px 18px" }}>
                <div className="staff-label-caps">Late</div>
                <div className="staff-mono" style={{ fontSize: 26, color: "var(--staff-warning)", marginTop: 4 }}>
                  {attendanceSessions.filter((a: any) => a.checkInTime && isCheckInLate(a.checkInTime, firmOfficeStartTime, firmTimezone)).length}
                </div>
              </div>

              <div className="staff-card" style={{ padding: "14px 18px" }}>
                <div className="staff-label-caps">Absent</div>
                <div className="staff-mono" style={{ fontSize: 26, color: "var(--staff-danger)", marginTop: 4 }}>
                  {stats.totalLeaveDaysThisYear > 0 ? stats.totalLeaveDaysThisYear : 0}
                </div>
              </div>

              <div className="staff-card" style={{ padding: "14px 18px" }}>
                <div className="staff-label-caps">Leave balance</div>
                <div className="staff-mono" style={{ fontSize: 26, color: "var(--staff-text)", marginTop: 4 }}>
                  {stats.leaveBalance} days
                </div>
              </div>
            </div>

            {/* Daily Attendance Records Table */}
            <div className="staff-card">
              <div
                className="staff-table-row staff-label-caps"
                style={{
                  gridTemplateColumns: "120px 130px 90px 90px 1fr",
                  borderTop: 0,
                  padding: "12px 20px",
                }}
              >
                <div>Date</div>
                <div>Status</div>
                <div>In</div>
                <div>Out</div>
                <div style={{ textAlign: "right" }}>Hours</div>
              </div>

              {attendanceSessions.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: "var(--staff-text-muted)" }}>
                  No attendance records recorded for this staff member.
                </div>
              ) : (
                attendanceSessions.map((s: any) => {
                  const inTime = s.checkInTime ? getTimeInTimezone(s.checkInTime, firmTimezone).formatted : "—";
                  const outTime = s.checkOutTime ? getTimeInTimezone(s.checkOutTime, firmTimezone).formatted : "—";
                  const isLate = s.checkInTime ? isCheckInLate(s.checkInTime, firmOfficeStartTime, firmTimezone) : false;
                  const isWorking = s.status === "working";

                  const pillColor = isWorking || s.status === "checked_out"
                    ? (isLate ? "var(--staff-warning)" : "var(--staff-success)")
                    : "var(--staff-danger)";
                  const pillLabel = isWorking ? "Present" : isLate ? "Late" : "Present";

                  return (
                    <div
                      key={s.id}
                      className="staff-table-row"
                      style={{
                        gridTemplateColumns: "120px 130px 90px 90px 1fr",
                        padding: "11px 20px",
                      }}
                    >
                      <div className="staff-mono" style={{ fontSize: 12 }}>
                        {format(parseISO(s.date), "EEE, MMM d")}
                      </div>
                      <div>
                        <span
                          className="staff-pill"
                          style={{
                            color: pillColor,
                            borderColor: `${pillColor}55`,
                            background: `${pillColor}14`,
                          }}
                        >
                          {pillLabel}
                        </span>
                      </div>
                      <div className="staff-mono staff-muted" style={{ fontSize: 12 }}>
                        {inTime}
                      </div>
                      <div className="staff-mono staff-muted" style={{ fontSize: 12 }}>
                        {outTime}
                      </div>
                      <div className="staff-mono staff-muted" style={{ fontSize: 12, textAlign: "right" }}>
                        {isWorking && !s.checkOutTime ? "in progress" : formatMinutes(s.totalWorkMinutes || 0)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Request Leave and Leave History */}
          <div className="staff-grid" style={{ gap: 20, alignContent: "start" }}>
            {/* Request Leave Card */}
            <div className="staff-card" style={{ padding: "18px 20px" }}>
              <div className="staff-label-caps" style={{ marginBottom: 8 }}>Request leave</div>
              <form onSubmit={handleLeaveSubmit}>
                <label className="staff-label">Leave type</label>
                <select
                  className="staff-input"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <option value="Casual leave">Casual leave</option>
                  <option value="Annual leave">Annual leave</option>
                  <option value="Sick leave">Sick leave</option>
                  <option value="Unpaid leave">Unpaid leave</option>
                </select>

                <div className="staff-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="staff-label">From</label>
                    <input
                      type="date"
                      required
                      className="staff-input"
                      value={leaveFrom}
                      onChange={(e) => setLeaveFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="staff-label">To</label>
                    <input
                      type="date"
                      required
                      className="staff-input"
                      value={leaveTo}
                      onChange={(e) => setLeaveTo(e.target.value)}
                    />
                  </div>
                </div>

                <label className="staff-label">Reason</label>
                <input
                  className="staff-input"
                  placeholder="e.g. Family function or appointment"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                />

                {/* Real-time Clash Check Alert */}
                {clashesFound.length > 0 && (
                  <div
                    style={{
                      margin: "16px 0",
                      padding: "12px 14px",
                      borderRadius: 8,
                      background: "rgba(242,181,68,0.08)",
                      border: "1px solid rgba(242,181,68,0.33)",
                    }}
                  >
                    <div style={{ color: "var(--staff-warning)", fontWeight: 500, fontSize: 13 }}>
                      {clashesFound.length} clash{clashesFound.length !== 1 ? "es" : ""} found
                    </div>
                    <div className="staff-muted" style={{ fontSize: 12, marginTop: 4 }}>
                      {clashesFound.slice(0, 3).map((c: any) => (
                        <div key={c.id}>
                          {format(parseISO(c.dueDate), "MMM d")} · Task due, {c.project?.name || "Project"} ({c.title})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="staff-flex-row" style={{ gap: 10, marginTop: 16 }}>
                  <button
                    type="submit"
                    disabled={submittingLeave}
                    className="staff-btn-primary"
                    style={{ flex: 1 }}
                  >
                    {submittingLeave ? "Submitting..." : "Submit request"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLeaveReason("");
                      setLeaveFrom(format(new Date(), "yyyy-MM-dd"));
                      setLeaveTo(format(new Date(), "yyyy-MM-dd"));
                    }}
                    className="staff-btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* Leave History Card */}
            <div className="staff-card" style={{ padding: "18px 20px" }}>
              <div className="staff-label-caps" style={{ marginBottom: 8 }}>Leave history</div>
              {allLeaveRequests.length === 0 ? (
                <div className="staff-muted" style={{ padding: "12px 0", fontSize: 13 }}>
                  No leave requests recorded.
                </div>
              ) : (
                allLeaveRequests.map((l: any) => {
                  const statusPillColor =
                    l.status === "approved" ? "var(--staff-success)"
                    : l.status === "pending" ? "var(--staff-warning)"
                    : "var(--staff-danger)";

                  return (
                    <div key={l.id} className="staff-log-item">
                      <span className="staff-mono staff-muted" style={{ width: 92, fontSize: 12 }}>
                        {format(parseISO(l.startDate), "MMM d")}–{format(parseISO(l.endDate), "d")}
                      </span>
                      <b style={{ flex: 1, textTransform: "capitalize" }}>{l.type} leave</b>
                      <span
                        className="staff-pill"
                        style={{
                          color: statusPillColor,
                          borderColor: `${statusPillColor}55`,
                          background: `${statusPillColor}14`,
                          textTransform: "capitalize",
                        }}
                      >
                        {l.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
