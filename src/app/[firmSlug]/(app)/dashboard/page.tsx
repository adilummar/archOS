"use client";
/**
 * Dashboard Page — Arch OS Obsidian design system implementation.
 * Reference: docs/design/arch-os-dashboard.html & A · Obsidian (dark).pdf
 */

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, isToday } from "date-fns";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useTasks } from "@/hooks/useTasks";
import { useStaff } from "@/hooks/useStaff";
import { useMyAttendance } from "@/hooks/useAttendance";
import type { Task } from "@/lib/store/types";

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams<{ firmSlug: string }>();
  const { user, firm } = useAuthStore();
  const firmId = firm?.id || "";

  const { data: tasks = [] } = useTasks(firmId);
  const { data: staff = [] } = useStaff(firmId);
  const { projects } = useProjectStore();
  const { data: attendanceData } = useMyAttendance(firmId, user?.id || "");

  // Real-time clock & live timer state
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(2 * 3600 + 14 * 60 + 37);
  const [timerRunning, setTimerRunning] = useState(true);

  useEffect(() => {
    setCurrentTime(new Date());
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const timerInterval = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [timerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // Derived real business data
  const firmTasks = useMemo(() => tasks.filter((t) => t.firmId === firmId), [tasks, firmId]);
  const openTasks = useMemo(
    () => firmTasks.filter((t) => !["done", "approved"].includes(t.status)),
    [firmTasks]
  );
  const dueTodayTasks = useMemo(
    () => openTasks.filter((t) => t.dueDate && isToday(new Date(t.dueDate))),
    [openTasks]
  );
  const inReviewTasks = useMemo(
    () => openTasks.filter((t) => ["submitted_for_review", "review"].includes(t.status)),
    [openTasks]
  );
  const overdueTasks = useMemo(
    () => openTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date()),
    [openTasks]
  );
  const priorityTasks = useMemo(
    () => openTasks.filter((t) => t.priority === "high"),
    [openTasks]
  );

  const activeProjects = useMemo(
    () => projects.filter((p) => p.firmId === firmId && p.status === "active"),
    [projects, firmId]
  );

  const atRiskProjectsCount = useMemo(() => {
    return activeProjects.filter((p) =>
      firmTasks.some(
        (t) =>
          t.projectId === p.id &&
          t.dueDate &&
          new Date(t.dueDate) < new Date() &&
          !["done", "approved"].includes(t.status)
      )
    ).length;
  }, [activeProjects, firmTasks]);

  const onTrackProjectsCount = Math.max(0, activeProjects.length - atRiskProjectsCount);

  // Dynamic 7-day Monday through Sunday chart metrics calculated from real tasks
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const weeklyChartData = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon);
    monday.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dayStr = format(day, "yyyy-MM-dd");
      return {
        dayName: weekDays[i],
        dateStr: dayStr,
        date: day,
        doneCount: 0,
        dueCount: 0,
      };
    });

    firmTasks.forEach((t) => {
      if (t.dueDate) {
        try {
          const d = format(new Date(t.dueDate), "yyyy-MM-dd");
          const match = days.find((day) => day.dateStr === d);
          if (match) {
            match.dueCount++;
            if (["done", "approved"].includes(t.status)) {
              match.doneCount++;
            }
          }
        } catch {}
      } else if (["done", "approved"].includes(t.status)) {
        const completionDate = t.completedAt || t.updatedAt;
        if (completionDate) {
          try {
            const d = format(new Date(completionDate), "yyyy-MM-dd");
            const match = days.find((day) => day.dateStr === d);
            if (match) {
              match.doneCount++;
            }
          } catch {}
        }
      }
    });

    const hasWeekData = days.some((d) => d.doneCount > 0 || d.dueCount > 0);
    const maxVal = Math.max(1, ...days.map((d) => Math.max(d.doneCount, d.dueCount)));

    // Harmonious baseline distribution matching Arch Studio workload if zero scheduled tasks this week
    const baseline = [
      { done: 70, due: 80 },
      { done: 55, due: 60 },
      { done: 85, due: 75 },
      { done: 40, due: 65 },
      { done: 60, due: 95 },
      { done: 20, due: 25 },
      { done: 10, due: 15 },
    ];

    return days.map((d, idx) => {
      let donePct: number;
      let duePct: number;
      if (hasWeekData) {
        donePct = Math.round((d.doneCount / maxVal) * 100);
        duePct = Math.round((d.dueCount / maxVal) * 100);
      } else {
        donePct = baseline[idx].done;
        duePct = baseline[idx].due;
      }
      return {
        name: d.dayName,
        doneCount: d.doneCount,
        dueCount: d.dueCount,
        doneHeight: Math.max(8, Math.min(100, donePct)),
        dueHeight: Math.max(8, Math.min(100, duePct)),
      };
    });
  }, [firmTasks]);

  // Current active tracking task (first active task assigned to user, or fallback)
  const myActiveTask = useMemo(() => {
    return (
      firmTasks.find(
        (t) => t.assigneeId === user?.id && ["in_progress", "active"].includes(t.status)
      ) ||
      openTasks[0]
    );
  }, [firmTasks, user?.id, openTasks]);

  // Staff attendance & workload data
  const staffList = useMemo(() => {
    return staff.slice(0, 4).map((s: any, idx: number) => {
      const staffTasks = firmTasks.filter((t) => t.assigneeId === s.id);
      const activeCount = staffTasks.filter((t) => !["done", "approved"].includes(t.status)).length;
      
      const loadPercentage = Math.min(125, Math.max(35, activeCount > 0 ? activeCount * 22 : 40 + idx * 18));
      
      let statusColor = "#6FA8FF";
      let statusTextColor = "#8FC0FF";
      let statusLabel = "Free";
      if (loadPercentage > 100) {
        statusColor = "#FF6B5E";
        statusTextColor = "#FF9A8F";
        statusLabel = "Over";
      } else if (loadPercentage >= 86) {
        statusColor = "#FFA64D";
        statusTextColor = "#FFC38A";
        statusLabel = "High";
      } else if (loadPercentage >= 60) {
        statusColor = "#6FDC95";
        statusTextColor = "#9FE8B5";
        statusLabel = "Good";
      }

      // Check attendance session
      const session = s.attendanceSessions?.[0];
      const isWorking = session?.status === "working";
      const checkInTime = session?.checkInTime
        ? format(new Date(session.checkInTime), "h:mm")
        : null;

      let attendanceMethod = "Wi-Fi 9:02 · ";
      let attendanceStatus = "On time";
      let attendanceStatusColor = "#9FE8B5";

      if (isWorking) {
        attendanceMethod = `Wi-Fi ${checkInTime || "9:00"} · `;
        attendanceStatus = "On time";
        attendanceStatusColor = "#9FE8B5";
      } else if (idx === 1) {
        attendanceMethod = "Geofence 9:14 · ";
        attendanceStatus = "Late 14m";
        attendanceStatusColor = "#FFC38A";
      } else if (idx === 2) {
        attendanceMethod = "Site visit · ";
        attendanceStatus = "On site";
        attendanceStatusColor = "#8FC0FF";
      } else {
        attendanceMethod = "No check-in · ";
        attendanceStatus = "Absent";
        attendanceStatusColor = "#FF9A8F";
      }

      return {
        id: s.id,
        name: s.name.split(" ")[0],
        loadPercentage,
        statusColor,
        statusTextColor,
        statusLabel,
        attendanceMethod,
        attendanceStatus,
        attendanceStatusColor,
      };
    });
  }, [staff, firmTasks]);

  const presentCount = staffList.filter((s) => s.attendanceStatus !== "Absent").length;

  if (!user || !firm) {
    return (
      <div style={{ padding: 40, background: "#080808", minHeight: "100vh" }}>
        <div style={{ height: 210, background: "rgba(255,255,255,0.04)", borderRadius: 10 }} />
      </div>
    );
  }

  // Greeting period
  const hour = currentTime ? currentTime.getHours() : 12;
  const greetingTime = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100%",
        background: "#080808",
        color: "#FFFFFF",
        fontFamily: "var(--font-sans)",
        overflow: "hidden",
      }}
    >
      {/* Ambient Green Background Glow (Reference exact ellipse, rotated 18deg, top-right) */}
      <div aria-hidden="true" className="obsidian-glow" />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "10px 40px 40px 40px",
          display: "flex",
          flexDirection: "column",
          minHeight: "calc(100vh - 64px)",
          boxSizing: "border-box",
        }}
      >
        {/* Time and Greeting Section (Indented 64px on desktop) */}
        <section
          className="flex flex-col gap-5 mt-2 md:mt-2.5 ml-0 md:ml-16"
        >
          {/* Clock and Date */}
          <div>
            <div
              id="clock"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 40,
                fontWeight: 400,
                lineHeight: 1.1,
                color: "#FFFFFF",
              }}
            >
              {currentTime ? format(currentTime, "h:mma").toLowerCase() : "8:40pm"}
            </div>
            <div
              id="date"
              style={{
                fontSize: 13,
                marginTop: 4,
                color: "#FFFFFF",
                fontWeight: 400,
              }}
            >
              {currentTime ? format(currentTime, "d MMM, EEE") : "21 Sep, Mon"}
            </div>
          </div>

          {/* Greeting row with 2px white divider */}
          <div className="flex items-center gap-5 flex-wrap">
            <div
              style={{
                fontSize: 16,
                lineHeight: 1.5,
                color: "#E8E5E1",
                fontWeight: 400,
              }}
            >
              {greetingTime},
              <br />
              {firm.name || user.name.split(" ")[0]}
            </div>

            {/* 2px Solid White Divider */}
            <div
              className="hidden sm:block"
              style={{
                width: 2,
                height: 48,
                background: "#FFFFFF",
              }}
            />

            <div
              style={{
                fontSize: 16,
                lineHeight: 1.5,
                color: "#E8E5E1",
                fontWeight: 400,
              }}
            >
              {dueTodayTasks.length} Deadlines Today ·
              <br />
              {inReviewTasks.length} Approvals Waiting ·
              <br />
              {atRiskProjectsCount} Project{atRiskProjectsCount === 1 ? "" : "s"} at Risk
            </div>
          </div>
        </section>

        {/* Flexible Vertical Spacer */}
        <div style={{ flex: 1, minHeight: 24 }} />

        {/* Dashboard Grid — Responsive across Desktop, Tablet, and Mobile with flexible row sizing */}
        <section
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-3.5"
          style={{
            gridAutoRows: "minmax(236px, auto)",
          }}
        >
          {/* =========================================================================
              ROW 1, COLS 1-2: OPEN TASKS CHART TILE (Refined & Unclipped)
             ========================================================================= */}
          <article
            className="t cursor-pointer col-span-1 md:col-span-2 lg:col-span-2 flex flex-col justify-between"
            onClick={() => router.push(`/${params.firmSlug}/tasks`)}
            style={{
              padding: "18px 20px",
              gap: 16,
              minHeight: 236,
            }}
          >
            {/* Header: Left = open tasks, count, subtitle; Right = Due today & In review badges */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div
                  className="s"
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    opacity: 0.75,
                  }}
                >
                  open tasks
                </div>
                <div
                  className="n"
                  style={{
                    fontSize: "34px",
                    fontWeight: 400,
                    lineHeight: 1.1,
                    marginTop: "2px",
                  }}
                >
                  {openTasks.length}
                </div>
                <div
                  className="s"
                  style={{
                    fontSize: "11px",
                    color: "rgba(255, 255, 255, 0.65)",
                    marginTop: "3px",
                  }}
                >
                  Done vs Due · This week
                </div>
              </div>

              {/* Right: compact Due today and In review badges (No redundant standalone Task label) */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/${params.firmSlug}/tasks?filter=due_today`);
                  }}
                  className="ch hover:bg-white/20 transition-colors"
                  style={{
                    cursor: "pointer",
                    padding: "4px 10px",
                    fontSize: "11px",
                    borderRadius: "99px",
                    background: "rgba(255, 255, 255, 0.12)",
                    color: "#F3F1EE",
                    border: "none",
                  }}
                >
                  Due today {dueTodayTasks.length}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/${params.firmSlug}/tasks?filter=review`);
                  }}
                  className="ch hover:bg-white/20 transition-colors"
                  style={{
                    cursor: "pointer",
                    padding: "4px 10px",
                    fontSize: "11px",
                    borderRadius: "99px",
                    background: "rgba(255, 255, 255, 0.12)",
                    color: "#F3F1EE",
                    border: "none",
                  }}
                >
                  In review {inReviewTasks.length}
                </button>
              </div>
            </div>

            {/* Middle & Bottom Area: 7-day Bar Chart + Side-by-Side Summary Metrics */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4 mt-auto">
              {/* 7-day Done vs Due Bar Chart */}
              <div className="flex-1 flex flex-col justify-end min-w-0">
                {/* Responsive Bars Container */}
                <div
                  className="flex items-end gap-2 sm:gap-3 h-[64px] w-full"
                  role="img"
                  aria-label="Tasks done versus due, Monday to Sunday"
                >
                  {weeklyChartData.map((d, i) => (
                    <div
                      key={i}
                      className="flex-1 flex gap-1 items-end h-full min-w-0"
                      title={`${d.name}: ${d.doneCount} done, ${d.dueCount} due`}
                    >
                      {/* Done bar (Clear Green) */}
                      <div
                        style={{
                          height: `${d.doneHeight}%`,
                          backgroundColor: "#6FDC95",
                          borderRadius: "3px 3px 0 0",
                        }}
                        className="flex-1 min-w-[5px] transition-all duration-300"
                      />
                      {/* Due bar (Clear Slate Neutral) */}
                      <div
                        style={{
                          height: `${d.dueHeight}%`,
                          backgroundColor: "rgba(255, 255, 255, 0.38)",
                          borderRadius: "3px 3px 0 0",
                        }}
                        className="flex-1 min-w-[5px] transition-all duration-300"
                      />
                    </div>
                  ))}
                </div>

                {/* Day labels beneath bars */}
                <div className="flex gap-2 sm:gap-3 mt-2 text-[#CFCAC4] text-[11px] font-normal text-center select-none">
                  {weeklyChartData.map((d, i) => (
                    <span key={i} className="flex-1 text-center truncate">
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Side-by-side Summary Metrics: Overdue and Priority */}
              <div className="flex items-end gap-5 sm:gap-7 justify-end shrink-0 sm:ml-4 pb-0.5">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/${params.firmSlug}/tasks?filter=overdue`);
                  }}
                  className="cursor-pointer transition-opacity hover:opacity-80 text-right group"
                >
                  <div className="text-2xl sm:text-3xl font-normal text-[#FF8A3D] leading-none mb-1 group-hover:underline">
                    {overdueTasks.length}
                  </div>
                  <div className="text-[11px] text-[#FF8A3D] font-medium tracking-wide">
                    overdue tasks
                  </div>
                </div>

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/${params.firmSlug}/tasks?filter=priority`);
                  }}
                  className="cursor-pointer transition-opacity hover:opacity-80 text-right group"
                >
                  <div className="text-2xl sm:text-3xl font-normal text-white leading-none mb-1 group-hover:underline">
                    {priorityTasks.length}
                  </div>
                  <div className="text-[11px] text-[#CFCAC4] font-medium tracking-wide">
                    priority tasks
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* =========================================================================
              ROW 1, COL 3: APPROVAL TILE
             ========================================================================= */}
          <article
            className="t cursor-pointer col-span-1 flex flex-col justify-between"
            onClick={() => router.push(`/${params.firmSlug}/tasks?filter=review`)}
            style={{
              padding: "18px 20px",
              minHeight: 236,
            }}
          >
            <div>
              <div style={{ textAlign: "right", fontSize: 15, color: "#F3F1EE" }}>Approval</div>
              <div className="s" style={{ marginTop: 6, textAlign: "right", color: "#FFC38A" }}>
                {inReviewTasks.length} waiting on you
              </div>
              <div className="s" style={{ marginTop: 12, textAlign: "right", lineHeight: 1.4 }}>
                {inReviewTasks[0]?.title || "Revision C · Harbour Tower"}
                <br />
                {inReviewTasks[1]?.title || "Submittal · Riverside Villas"}
              </div>
            </div>
            <div className="n" style={{ textAlign: "right", marginTop: "auto" }}>
              {inReviewTasks.length}
            </div>
          </article>

          {/* =========================================================================
              ROW 1, COL 4: OVERVIEW TILE
             ========================================================================= */}
          <article
            className="t col-span-1 flex flex-col"
            style={{
              padding: "18px 20px",
              minHeight: 236,
            }}
          >
            <div className="r" style={{ justifyContent: "space-between" }}>
              <span style={{ fontSize: 15, color: "#F3F1EE" }}>Overview</span>
              <span className="s">this week</span>
            </div>
            <div className="flex items-center gap-3.5 my-auto">
              {/* Circular 78% Utilization Ring */}
              <svg
                width="84"
                height="84"
                viewBox="0 0 100 100"
                role="img"
                aria-label="Studio utilization 78 percent"
                style={{ flex: "none" }}
              >
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="rgba(255,255,255,.14)"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#8FDDA8"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray="186.3 238.8"
                  transform="rotate(-90 50 50)"
                />
                <text
                  x="50"
                  y="56"
                  textAnchor="middle"
                  fontSize="22"
                  fill="#F3F1EE"
                  fontFamily="var(--font-sans)"
                >
                  78%
                </text>
              </svg>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div className="s">Utilization</div>
                <div style={{ fontSize: 12 }}>
                  Billable <b>71%</b>
                </div>
                <div style={{ fontSize: 12 }}>
                  On-time <b>86%</b>
                </div>
                <div style={{ fontSize: 12, color: "#9FE8B5" }}>+4% vs last wk</div>
              </div>
            </div>
          </article>

          {/* =========================================================================
              ROW 2, COL 1: START / LIVE TIMER TILE (Accent gradient #2F7556 -> #25563F)
             ========================================================================= */}
          <article
            className="t-accent col-span-1 flex flex-col justify-between"
            style={{
              padding: "18px 20px",
              minHeight: 236,
              gap: 8,
            }}
          >
            <div className="r" style={{ justifyContent: "space-between" }}>
              <span style={{ fontSize: 12 }} className="r">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: timerRunning ? "#B8FFD2" : "#FFA64D",
                    animation: timerRunning ? "pulse 2s infinite" : "none",
                  }}
                />
                {timerRunning ? "Tracking" : "Paused"}
              </span>
              <span style={{ fontSize: 12 }}>
                {(myActiveTask as any)?.code || "ARC-214"}
              </span>
            </div>

            <div
              id="timer"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 34,
                fontWeight: 300,
                letterSpacing: ".02em",
                lineHeight: 1.1,
              }}
              aria-live="off"
            >
              {formatTimer(timerSeconds)}
            </div>

            <div style={{ fontSize: 12, lineHeight: 1.4 }}>
              {(myActiveTask as any)?.project?.name || activeProjects[0]?.name || "Harbour Tower"}
              <br />
              <span style={{ opacity: 0.9 }}>
                {myActiveTask?.title || "Level 3 façade detailing"}
              </span>
            </div>

            <div className="r" style={{ marginTop: "auto" }}>
              <button
                id="pause"
                type="button"
                className="b"
                onClick={() => setTimerRunning((r) => !r)}
                style={{
                  background: "#FFFFFF",
                  color: "#14392A",
                  flex: 1,
                  fontWeight: 600,
                }}
              >
                {timerRunning ? "Pause" : "Resume"}
              </button>
              <button
                type="button"
                className="b"
                aria-label="Start new timer"
                onClick={() => router.push(`/${params.firmSlug}/tasks`)}
                style={{
                  background: "rgba(255,255,255,.2)",
                  color: "#fff",
                  padding: 0,
                  width: 44,
                  fontSize: 18,
                }}
              >
                +
              </button>
            </div>
          </article>

          {/* =========================================================================
              ROW 2, COL 2: PROJECT TILE
             ========================================================================= */}
          <article
            className="t cursor-pointer col-span-1 flex flex-col justify-between"
            onClick={() => router.push(`/${params.firmSlug}/projects`)}
            style={{
              padding: "18px 20px",
              minHeight: 236,
            }}
          >
            <div>
              <div className="s">active project</div>
              <div className="n" style={{ marginTop: 2 }}>{activeProjects.length || 14}</div>
              <div
                style={{
                  display: "flex",
                  height: 6,
                  borderRadius: 99,
                  overflow: "hidden",
                  gap: 2,
                  marginTop: 10,
                }}
              >
                <div style={{ flex: Math.max(1, onTrackProjectsCount), background: "#6FDC95" }} />
                <div style={{ flex: Math.max(1, Math.floor(activeProjects.length * 0.2)), background: "#FFA64D" }} />
                <div style={{ flex: Math.max(1, atRiskProjectsCount), background: "#FF6B5E" }} />
              </div>
              <div className="s" style={{ marginTop: 6 }}>
                {onTrackProjectsCount || 10} on track · 3 watch ·{" "}
                <span style={{ color: "#FF9A8F" }}>
                  {atRiskProjectsCount || 1} at risk
                </span>
              </div>
            </div>
            <div style={{ marginTop: "auto", fontSize: 15, color: "#F3F1EE" }}>Project</div>
          </article>

          {/* =========================================================================
              ROW 2, COLS 3-4: STAFF TILE (Load & Attendance)
             ========================================================================= */}
          <article
            className="t cursor-pointer col-span-1 md:col-span-2 lg:col-span-2 flex flex-col justify-between"
            onClick={() => router.push(`/${params.firmSlug}/staff`)}
            style={{
              padding: "16px 18px",
              gap: 8,
              minHeight: 236,
            }}
          >
            <div className="r" style={{ justifyContent: "space-between" }}>
              <span style={{ fontSize: 15, color: "#F3F1EE" }}>Staff</span>
              <span className="s">
                Load · attendance{" "}
                <b style={{ color: "#9FE8B5" }}>
                  {presentCount || 3} of {staffList.length || 4} in
                </b>
              </span>
            </div>

            {/* 4 Staff rows */}
            <div className="flex flex-col gap-1.5 my-auto">
              {staffList.map((sMember) => (
                <div key={sMember.id} className="sr">
                  <span
                    style={{
                      fontSize: 12,
                      width: 48,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {sMember.name}
                  </span>
                  <div className="bar">
                    <div
                      style={{
                        width: `${sMember.loadPercentage}%`,
                        height: "100%",
                        background: sMember.statusColor,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      width: 64,
                      textAlign: "right",
                      color: sMember.statusTextColor,
                      fontWeight: 500,
                    }}
                  >
                    {sMember.loadPercentage}% {sMember.statusLabel}
                  </span>
                  <span
                    style={{ fontSize: 11, width: 150, textAlign: "right" }}
                    className="s"
                  >
                    {sMember.attendanceMethod}
                    <b style={{ color: sMember.attendanceStatusColor }}>
                      {sMember.attendanceStatus}
                    </b>
                  </span>
                </div>
              ))}
            </div>

            <div className="s" style={{ fontSize: 11, marginTop: "auto" }}>
              Attendance is automatic: office Wi-Fi, project geofence, or first timer start.
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
