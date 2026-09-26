"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { getStaffProfile } from "@/app/actions/staff.actions";
import { getUserLogsByDate } from "@/app/actions/log.actions";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { Avatar } from "@/components/shared/Avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  ArrowLeft, Clock, Coffee, CheckCircle2, Calendar,
  Briefcase, ListChecks, Activity, Phone, Mail,
  TrendingUp, AlertCircle, ChevronLeft, ChevronRight
} from "lucide-react";
import { format, isToday, parseISO } from "date-fns";

type Profile = Awaited<ReturnType<typeof getStaffProfile>>;

function formatMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function LiveTimer({ checkInTime }: { checkInTime: Date }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(checkInTime).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [checkInTime]);
  const h = Math.floor(elapsed / 3600).toString().padStart(2, "0");
  const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");
  return <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 800, fontSize: "var(--text-2xl)", color: "#06D6A0" }}>{h}:{m}:{s}</span>;
}

export default function StaffDetailPage() {
  const params = useParams<{ firmSlug: string; staffId: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { projects } = useProjectStore();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "attendance" | "activity">("overview");

  // Activity Tab State
  const [activityDate, setActivityDate] = useState<Date>(new Date());
  const [dailyLogs, setDailyLogs] = useState<NonNullable<Profile>["recentLogs"]>([]);
  const [loadingDailyLogs, setLoadingDailyLogs] = useState(false);

  const load = useCallback(async () => {
    if (!params.staffId) return;
    setLoading(true);
    try {
      const data = await getStaffProfile(params.staffId);
      setProfile(data);
    } finally {
      setLoading(false);
    }
  }, [params.staffId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (activeTab === "activity" && params.staffId) {
      setLoadingDailyLogs(true);
      getUserLogsByDate(params.staffId, format(activityDate, "yyyy-MM-dd"))
        .then((logs) => setDailyLogs(logs))
        .finally(() => setLoadingDailyLogs(false));
    }
  }, [activeTab, activityDate, params.staffId]);

  if (loading) {
    return (
      <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
        <SkeletonCard count={3} height={160} />
      </div>
    );
  }

  if (!profile?.user) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>
        Staff member not found.
      </div>
    );
  }

  const { user, todaySession, attendance, tasks, recentLogs, stats } = profile;
  const todayAttendanceStatus = todaySession?.status ?? "not_in";

  const statusColor =
    todayAttendanceStatus === "working" ? "#06D6A0"
    : todayAttendanceStatus === "on_break" ? "#FFB703"
    : todayAttendanceStatus === "checked_out" ? "var(--color-text-secondary)"
    : "var(--color-text-muted)";

  const statusLabel =
    todayAttendanceStatus === "working" ? "Working Now"
    : todayAttendanceStatus === "on_break" ? "On Break"
    : todayAttendanceStatus === "checked_out" ? "Checked Out"
    : "Not In Today";

  const activeProjects = user.projectStaff
    .filter((ps) => ps.project.status === "active")
    .map((ps) => ps.project);

  const tabs: Array<{ key: typeof activeTab; label: string; icon: React.ReactNode }> = [
    { key: "overview", label: "Overview", icon: <TrendingUp size={14} /> },
    { key: "tasks", label: `Tasks (${stats.totalPending})`, icon: <ListChecks size={14} /> },
    { key: "attendance", label: "Attendance", icon: <Calendar size={14} /> },
    { key: "activity", label: "Activity", icon: <Activity size={14} /> },
  ];

  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Back button */}
      <button
        onClick={() => router.back()}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "var(--text-sm)", cursor: "pointer", padding: 0, width: "fit-content" }}
      >
        <ArrowLeft size={15} /> Back to Staff
      </button>

      {/* Profile header card */}
      <div style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: 28,
        display: "flex",
        gap: 24,
        alignItems: "flex-start",
      }}>
        <Avatar
          name={user.name}
          initials={user.avatarInitials ?? user.name.slice(0, 2).toUpperCase()}
          color={user.avatarColor ?? "#E85D04"}
          size="xl"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {user.name}
            </h1>
            <span style={{
              padding: "2px 10px", borderRadius: 99,
              background: "var(--color-accent-muted)",
              color: "var(--color-accent)",
              fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase",
            }}>
              {user.role.replace("_", " ")}
            </span>
          </div>
          <p style={{ margin: "0 0 12px", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
            {user.designation ?? "—"}
          </p>

          {/* Contact */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
            {user.email && (
              <a href={`mailto:${user.email}`} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", textDecoration: "none" }}>
                <Mail size={12} /> {user.email}
              </a>
            )}
            {user.phone && (
              <a href={`tel:${user.phone}`} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", textDecoration: "none" }}>
                <Phone size={12} /> {user.phone}
              </a>
            )}
          </div>

          {/* Today's status */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor,
              boxShadow: todayAttendanceStatus === "working" ? `0 0 6px ${statusColor}` : "none",
            }} />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: statusColor }}>
              {statusLabel}
            </span>
            {todaySession?.checkInTime && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                · In at {format(new Date(todaySession.checkInTime), "hh:mm a")}
              </span>
            )}
            {todaySession?.status === "working" && (
              <LiveTimer checkInTime={new Date(todaySession.checkInTime)} />
            )}
          </div>
        </div>
      </div>


      {/* Tabs */}
      <div>
        <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: 20, gap: 4 }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 16px",
                background: "none", border: "none",
                borderBottom: activeTab === tab.key ? "2px solid var(--color-accent)" : "2px solid transparent",
                color: activeTab === tab.key ? "var(--color-accent)" : "var(--color-text-muted)",
                fontSize: "var(--text-sm)", fontWeight: 600,
                cursor: "pointer",
                transition: "color 0.15s",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Overview Stats strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Days Present", value: `${stats.presentDays}`, sub: "last 30 days", color: "var(--color-accent)" },
                { label: "Total Work", value: formatMinutes(stats.totalWorkMinutes), sub: "last 30 days", color: "var(--color-text-primary)" },
                { label: "Avg / Day", value: formatMinutes(stats.avgDailyMinutes), sub: "when present", color: "var(--color-text-primary)" },
                { label: "Open Tasks", value: `${stats.totalPending}`, sub: `${stats.totalDone} done`, color: stats.totalPending > 5 ? "#FF6B6B" : "var(--color-text-primary)" },
              ].map((s) => (
                <div key={s.label} style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px 18px" }}>
                  <p style={{ margin: "0 0 2px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>{s.label}</p>
                  <p style={{ margin: "0 0 2px", fontSize: "var(--text-xl)", fontWeight: 800, color: s.color }}>{s.value}</p>
                  <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Today's session detail */}
            {todaySession && (
              <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 24 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock size={16} /> Today's Session
                </h3>
                <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600 }}>CHECK IN</p>
                    <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-primary)" }}>
                      {format(new Date(todaySession.checkInTime), "hh:mm a")}
                    </p>
                  </div>
                  {todaySession.checkOutTime && (
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600 }}>CHECK OUT</p>
                      <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {format(new Date(todaySession.checkOutTime), "hh:mm a")}
                      </p>
                    </div>
                  )}
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600 }}>WORK TIME</p>
                    <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 700, color: "#06D6A0" }}>
                      {formatMinutes(todaySession.totalWorkMinutes)}
                    </p>
                  </div>
                  {todaySession.totalBreakMinutes > 0 && (
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600 }}>BREAK TIME</p>
                      <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 700, color: "#FFB703" }}>
                        {formatMinutes(todaySession.totalBreakMinutes)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Task segments */}
                {todaySession.taskSegments.length > 0 && (
                  <div>
                    <p style={{ margin: "0 0 10px", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                      Tasks worked on today
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {todaySession.taskSegments.map((seg, i) => {
                        const proj = user.projectsAsLead?.find((p) => p.id === seg.projectId) || user.projectStaff.find((p) => p.project.id === seg.projectId)?.project;
                        return (
                          <div key={seg.id} style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "8px 12px",
                            background: "var(--color-bg-canvas)",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--color-border)",
                          }}>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: "0 0 2px", fontSize: "var(--text-sm)", color: "var(--color-text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                Task #{i + 1} · {proj?.name ?? seg.projectId}
                              </p>
                              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                                {format(new Date(seg.startTime), "hh:mm a")}
                                {seg.endTime && ` — ${format(new Date(seg.endTime), "hh:mm a")}`}
                                {!seg.endTime && " · ongoing"}
                              </p>
                            </div>
                            {seg.durationMinutes !== null && seg.durationMinutes !== undefined && (
                              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-primary)", flexShrink: 0, marginLeft: 12 }}>
                                {formatMinutes(seg.durationMinutes)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Active projects */}
            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 20 }}>
              <h4 style={{ margin: "0 0 14px", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                <Briefcase size={15} /> Active Projects ({activeProjects.length})
              </h4>
              {activeProjects.length === 0 ? (
                <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Not assigned to any active projects.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {activeProjects.map((p) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)", fontWeight: 500 }}>{p.name}</span>
                      {p.teamLeadId === user.id && (
                        <span style={{ fontSize: "var(--text-xs)", padding: "2px 8px", borderRadius: 99, background: "var(--color-accent-muted)", color: "var(--color-accent)", fontWeight: 700 }}>
                          Team Lead
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming tasks */}
            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 20 }}>
              <h4 style={{ margin: "0 0 14px", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                <AlertCircle size={15} /> Pending Tasks ({tasks.slice(0, 5).length})
              </h4>
              {tasks.length === 0 ? (
                <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>No open tasks. All clear! ✅</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tasks.slice(0, 5).map((t) => (
                    <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 2px", fontSize: "var(--text-sm)", color: "var(--color-text-primary)", fontWeight: 500 }}>{t.title}</p>
                        <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                          {t.project?.name ?? "—"} {t.dueDate ? `· Due ${format(new Date(t.dueDate), "MMM d")}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={t.priority === "high" ? "blocked" : t.status === "in_progress" ? "active" : "pending"} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tasks tab */}
        {activeTab === "tasks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Tasks Stats strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Active Tasks", value: `${tasks.filter((t) => t.status === "in_progress").length}`, sub: "currently working", color: "var(--color-accent)" },
                { label: "Pending", value: `${tasks.filter((t) => t.status === "todo").length}`, sub: "to do", color: "var(--color-text-primary)" },
                { label: "Blocked", value: `${tasks.filter((t) => t.status === "blocked").length}`, sub: "needs attention", color: "#FF6B6B" },
                { label: "Total Completed", value: `${stats.totalDone}`, sub: "all time", color: "#06D6A0" },
              ].map((s) => (
                <div key={s.label} style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px 18px" }}>
                  <p style={{ margin: "0 0 2px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>{s.label}</p>
                  <p style={{ margin: "0 0 2px", fontSize: "var(--text-xl)", fontWeight: 800, color: s.color }}>{s.value}</p>
                  <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{s.sub}</p>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 20 }}>
            {tasks.length === 0 ? (
              <p style={{ margin: 0, color: "var(--color-text-muted)", textAlign: "center", padding: "20px 0" }}>No open tasks assigned.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {tasks.map((t, i) => (
                  <div key={t.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0",
                    borderBottom: i < tasks.length - 1 ? "1px solid var(--color-border)" : "none",
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 4px", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>{t.title}</p>
                      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        {t.project?.name ?? "—"} · {t.stage?.name ?? "No stage"}
                        {t.dueDate && ` · Due ${format(new Date(t.dueDate), "MMM d, yyyy")}`}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <StatusBadge status={t.priority === "high" ? "blocked" : t.status === "in_progress" ? "active" : "pending"} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Attendance tab */}
        {activeTab === "attendance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Attendance Stats strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Days Present", value: `${stats.presentDays}`, sub: "last 30 days", color: "var(--color-accent)" },
                { label: "Total Work Time", value: formatMinutes(stats.totalWorkMinutes), sub: "last 30 days", color: "var(--color-text-primary)" },
                { label: "Avg / Day", value: formatMinutes(stats.avgDailyMinutes), sub: "when present", color: "var(--color-text-primary)" },
                { label: "Total Breaks", value: formatMinutes(attendance.reduce((acc, curr) => acc + curr.totalBreakMinutes, 0)), sub: "last 30 days", color: "#FFB703" },
              ].map((s) => (
                <div key={s.label} style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px 18px" }}>
                  <p style={{ margin: "0 0 2px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>{s.label}</p>
                  <p style={{ margin: "0 0 2px", fontSize: "var(--text-xl)", fontWeight: 800, color: s.color }}>{s.value}</p>
                  <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{s.sub}</p>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {attendance.length === 0 ? (
                <p style={{ margin: 0, color: "var(--color-text-muted)", textAlign: "center", padding: "20px 0" }}>No attendance records in the last 30 days.</p>
              ) : attendance.map((a, i) => (
                <div key={a.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: i < attendance.length - 1 ? "1px solid var(--color-border)" : "none",
                }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {format(parseISO(a.date), "EEE, MMM d, yyyy")}
                      {isToday(parseISO(a.date)) && (
                        <span style={{ marginLeft: 6, fontSize: "var(--text-xs)", color: "var(--color-accent)", fontWeight: 700 }}>Today</span>
                      )}
                    </p>
                    <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {format(new Date(a.checkInTime), "hh:mm a")}
                      {a.checkOutTime && ` — ${format(new Date(a.checkOutTime), "hh:mm a")}`}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: "var(--text-xs)", color: "#06D6A0", fontWeight: 700 }}>
                      {formatMinutes(a.totalWorkMinutes)}
                    </span>
                    {a.totalBreakMinutes > 0 && (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        Break: {formatMinutes(a.totalBreakMinutes)}
                      </span>
                    )}
                    <StatusBadge status={a.status === "checked_out" ? "done" : a.status === "on_break" ? "on_hold" : "active"} />
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        )}

        {/* Activity tab */}
        {activeTab === "activity" && (
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, alignItems: "flex-start" }}>
            <MiniCalendar selectedDate={activityDate} onSelectDate={setActivityDate} />
            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 20 }}>
              <h4 style={{ margin: "0 0 16px", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-primary)" }}>
                Activity on {format(activityDate, "MMMM d, yyyy")}
              </h4>
              {loadingDailyLogs ? (
                <SkeletonCard count={3} height={60} />
              ) : dailyLogs.length === 0 ? (
                <p style={{ margin: 0, color: "var(--color-text-muted)", textAlign: "center", padding: "20px 0" }}>No activity on this date.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {dailyLogs.map((log, i) => (
                    <div key={log.id} style={{
                      display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0",
                      borderBottom: i < dailyLogs.length - 1 ? "1px solid var(--color-border)" : "none",
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: "var(--color-accent-muted)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <Activity size={14} color="var(--color-accent)" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 2px", fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>{log.description}</p>
                        <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                          {log.project?.name && `${log.project.name} · `}
                          {format(new Date(log.createdAt), "MMM d, hh:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniCalendar({ selectedDate, onSelectDate }: { selectedDate: Date, onSelectDate: (d: Date) => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  return (
    <div style={{ width: "100%", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Days of week */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8, textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600 }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const isTodayDate = date.toDateString() === new Date().toDateString();
          return (
            <button 
              key={i} 
              onClick={() => onSelectDate(date)}
              style={{ 
                aspectRatio: "1/1", borderRadius: "50%", border: "none",
                background: isSelected ? "var(--color-accent)" : isTodayDate ? "var(--color-bg-canvas)" : "transparent",
                color: isSelected ? "white" : isTodayDate ? "var(--color-accent)" : "var(--color-text-primary)",
                cursor: "pointer", fontSize: "var(--text-xs)", fontWeight: isSelected || isTodayDate ? 700 : 500,
                display: "flex", alignItems: "center", justifyContent: "center", padding: 0
              }}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
    </div>
  );
}


