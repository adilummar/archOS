"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useTasks } from "@/hooks/useTasks";
import { useMyAttendance, useAttendanceHistory, useTaskTimeBreakdown, useAttendanceMutations } from "@/hooks/useAttendance";
import { useTaskStore } from "@/lib/store/task.store";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { toast } from "@/lib/store/toast.store";
import {
  LogIn,
  Coffee,
  Play,
  LogOut,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  Calendar,
  Users,
} from "lucide-react";
import { format } from "date-fns";

type Session = any;
type History = any[];

function formatMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function LiveTimer({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const h = Math.floor(elapsed / 3600).toString().padStart(2, "0");
  const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");

  return (
    <span style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em" }}>
      {h}:{m}:{s}
    </span>
  );
}

export default function AttendancePage() {
  const router = useRouter();
  const params = useParams<{ firmSlug: string }>();
  const { user, firm } = useAuthStore();
  const { projects } = useProjectStore();
  const { data: tasks = [] } = useTasks(firm?.id || "");
  const { data: session, isLoading: sessionLoading } = useMyAttendance(firm?.id || "", user?.id || "");
  const { data: history = [] } = useAttendanceHistory(firm?.id || "", user?.id || "");
  const { data: taskBreakdown = [] } = useTaskTimeBreakdown(session?.id || "");
  const muts = useAttendanceMutations(firm?.id || "", user?.id || "");
  const loading = sessionLoading;
  
  const dbTasks = tasks;
  const setDbTasks = () => {};
  const [markDone, setMarkDone] = useState(false);
  const firmProjects = projects;
  const tasksForProject = (pid: string) => tasks.filter((t: any) => t.projectId === pid);
  const setLoading = (v: boolean) => {};

  const [submitting, setSubmitting] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [switchProjectId, setSwitchProjectId] = useState<string>("");
  const [switchTaskId, setSwitchTaskId] = useState<string>("");if (!user || !firm) return null;

  // ── HANDLERS ──────────────────────────────────────────────────────────────

  const handleCheckIn = async () => {
    if (!selectedProjectId || !selectedTaskId) {
      toast("Please select a project and task to check in", "error");
      return;
    }
    setSubmitting(true);
    try {
      await muts.checkIn.mutateAsync({
        userId: user.id,
        email: user.email,        // fallback for ID resolution
        firmId: firm.id,
        projectId: selectedProjectId,
        taskId: selectedTaskId,
      });
            toast("Checked in! Have a productive day 🚀", "success");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwitchTask = async () => {
    if (!session || !switchProjectId || !switchTaskId) {
      toast("Please select a project and task to switch to", "error");
      return;
    }
    setSubmitting(true);
    try {
      await muts.switchTask.mutateAsync({ sessionId: session.id, projectId: selectedProjectId, taskId: selectedTaskId });
                  setSwitching(false);
      setSwitchProjectId("");
      setSwitchTaskId("");
      setMarkDone(false);
      toast(
        markDone ? "Task marked done! Switched to new task." : "Switched task successfully.",
        "success"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBreak = async () => {
    if (!session) return;
    setSubmitting(true);
    try {
      await muts.startBreak.mutateAsync({ sessionId: session.id, type: "coffee" });
            toast("Break started. Rest up! ☕", "default");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResume = async () => {
    if (!session) return;
    setSubmitting(true);
    try {
      await muts.endBreak.mutateAsync({ sessionId: session.id });
            toast("Welcome back! Timer resumed.", "success");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    if (!session) return;
    setSubmitting(true);
    try {
      await muts.checkOut.mutateAsync({ sessionId: session.id }); // IDs resolved server-side from session record
                  toast(
        `Checked out! Total work: ${formatMinutes(session.totalWorkMinutes)}`,
        "success"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── CURRENT TASK AND PROJECT NAMES ─────────────────────────────────────────
  const currentProject = projects.find((p) => p.id === session?.currentProjectId);
  const currentTask = dbTasks.find((t) => t.id === session?.currentTaskId);

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
          Attendance
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {loading ? (
        <SkeletonCard count={2} height={180} />
      ) : !session ? (

        /* ── NOT CHECKED IN ─────────────────────────────────────────────────── */
        <div style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: 40,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          alignItems: "center",
          textAlign: "center",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "var(--color-accent-muted)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <LogIn size={28} color="var(--color-accent)" />
          </div>
          <div>
            <h2 style={{ margin: "0 0 8px", fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-text-primary)" }}>
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, {user.name.split(" ")[0]}!
            </h2>
            <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
              Select a project and task to start your day.
            </p>
          </div>

          <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Project select */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "left" }}>
              <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                Project <span style={{ color: "var(--color-accent)" }}>*</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => { setSelectedProjectId(e.target.value); setSelectedTaskId(""); }}
                style={selectStyle}
              >
                <option value="">— Select project —</option>
                {firmProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Task select */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "left" }}>
              <label style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                Task <span style={{ color: "var(--color-accent)" }}>*</span>
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                disabled={!selectedProjectId}
                style={{ ...selectStyle, opacity: selectedProjectId ? 1 : 0.5 }}
              >
                <option value="">— Select task —</option>
                {tasksForProject(selectedProjectId).map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              {selectedProjectId && tasksForProject(selectedProjectId).length === 0 && (
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  No open tasks assigned to you in this project.
                </p>
              )}
            </div>

            <button
              onClick={handleCheckIn}
              disabled={submitting || !selectedProjectId || !selectedTaskId}
              style={primaryBtn}
            >
              <LogIn size={16} />
              {submitting ? "Checking in..." : "Check In & Start Work"}
            </button>
          </div>
        </div>

      ) : session.status === "checked_out" ? (

        /* ── CHECKED OUT — SUMMARY ───────────────────────────────────────────── */
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ ...iconCircle, background: "var(--color-success-muted)" }}>
              <CheckCircle2 size={24} color="var(--color-success)" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text-primary)" }}>
                Day Complete!
              </h2>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                Checked in {format(new Date(session.checkInTime), "hh:mm a")} · Checked out {session.checkOutTime ? format(new Date(session.checkOutTime), "hh:mm a") : "—"}
              </p>
            </div>
          </div>

          {/* Summary stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <StatCard label="Total Work Time" value={formatMinutes(session.totalWorkMinutes)} color="var(--color-accent)" />
            <StatCard label="Total Break Time" value={formatMinutes(session.totalBreakMinutes)} color="var(--color-text-muted)" />
          </div>

          {/* Task time breakdown */}
          <TaskBreakdown breakdown={taskBreakdown} tasks={dbTasks} projects={projects} />
        </div>

      ) : (

        /* ── ACTIVE SESSION ──────────────────────────────────────────────────── */
        <>
          <div style={cardStyle}>
            {/* Status banner */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 24,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  ...iconCircle,
                  background: session.status === "on_break" ? "rgba(255,183,3,0.15)" : "rgba(6,214,160,0.15)",
                  animation: session.status === "working" ? "pulse 2s ease-in-out infinite" : "none",
                }}>
                  {session.status === "on_break"
                    ? <Coffee size={22} color="#FFB703" />
                    : <Clock size={22} color="var(--color-success)" />
                  }
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>
                    {session.status === "on_break" ? "On Break" : "Working"}
                  </p>
                  <div style={{ fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1.2 }}>
                    <LiveTimer startTime={new Date(session.checkInTime)} />
                  </div>
                </div>
              </div>
              <StatusBadge status={session.status === "on_break" ? "on_hold" : "active"} />
            </div>

            {/* Current task */}
            <div style={{
              background: "var(--color-bg-canvas)",
              borderRadius: "var(--radius-md)",
              padding: "16px 20px",
              marginBottom: 24,
              border: "1px solid var(--color-border)",
            }}>
              <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                Current Task
              </p>
              <p style={{ margin: "0 0 2px", fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                {currentTask?.title ?? "—"}
              </p>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                {currentProject?.name ?? "—"}
              </p>
            </div>

            {/* Action buttons */}
            {session.status === "working" ? (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={() => setSwitching(true)} disabled={submitting} style={outlineBtn}>
                  <ArrowRightLeft size={15} /> Switch Task
                </button>
                <button onClick={handleBreak} disabled={submitting} style={outlineBtn}>
                  <Coffee size={15} /> Take a Break
                </button>
                <button onClick={handleCheckOut} disabled={submitting} style={{ ...outlineBtn, color: "var(--color-destructive)", borderColor: "var(--color-destructive)" }}>
                  <LogOut size={15} /> Check Out
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={handleResume} disabled={submitting} style={primaryBtn}>
                  <Play size={15} /> Resume Work
                </button>
                <button onClick={handleCheckOut} disabled={submitting} style={{ ...outlineBtn, color: "var(--color-destructive)", borderColor: "var(--color-destructive)" }}>
                  <LogOut size={15} /> Check Out
                </button>
              </div>
            )}
          </div>

          {/* Switch Task Panel */}
          {switching && (
            <div style={{ ...cardStyle, border: "1px solid var(--color-accent)" }}>
              <h3 style={{ margin: "0 0 20px", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-primary)" }}>
                Switch to a Different Task
              </h3>

              {/* Mark current as done */}
              <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={markDone}
                  onChange={(e) => setMarkDone(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "var(--color-accent)" }}
                />
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                  Mark <strong>"{currentTask?.title}"</strong> as Done
                </span>
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <select
                  value={switchProjectId}
                  onChange={(e) => { setSwitchProjectId(e.target.value); setSwitchTaskId(""); }}
                  style={selectStyle}
                >
                  <option value="">— Select new project —</option>
                  {firmProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select
                  value={switchTaskId}
                  onChange={(e) => setSwitchTaskId(e.target.value)}
                  disabled={!switchProjectId}
                  style={{ ...selectStyle, opacity: switchProjectId ? 1 : 0.5 }}
                >
                  <option value="">— Select new task —</option>
                  {tasksForProject(switchProjectId)
                    .filter((t) => t.id !== session.currentTaskId)
                    .map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={handleSwitchTask} disabled={submitting || !switchProjectId || !switchTaskId} style={primaryBtn}>
                    <ArrowRightLeft size={15} /> {submitting ? "Switching..." : "Switch"}
                  </button>
                  <button onClick={() => setSwitching(false)} style={outlineBtn}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Task time breakdown so far today */}
          {taskBreakdown.length > 0 && (
            <div style={cardStyle}>
              <h3 style={{ margin: "0 0 16px", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-primary)" }}>
                Today's Task Breakdown
              </h3>
              <TaskBreakdown breakdown={taskBreakdown} tasks={dbTasks} projects={projects} />
            </div>
          )}
        </>
      )}

      {/* Attendance History */}
      {history.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 20px", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={18} /> Recent Attendance
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {history.map((s) => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 0",
                borderBottom: "1px solid var(--color-border)",
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {format(new Date(s.date), "EEE, MMM d")}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    {format(new Date(s.checkInTime), "hh:mm a")}
                    {s.checkOutTime && ` — ${format(new Date(s.checkOutTime), "hh:mm a")}`}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    Work: <strong>{formatMinutes(session.totalWorkMinutes)}</strong>
                  </span>
                  {s.totalBreakMinutes > 0 && (
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      Break: {formatMinutes(s.totalBreakMinutes)}
                    </span>
                  )}
                  <StatusBadge status={s.status === "checked_out" ? "done" : s.status === "on_break" ? "on_hold" : "active"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>
    </div>
  );
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: "var(--color-bg-canvas)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-md)",
      padding: "20px 24px",
    }}>
      <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{label}</p>
      <p style={{ margin: 0, fontSize: "var(--text-2xl)", fontWeight: 800, color }}>{value}</p>
    </div>
  );
}

function TaskBreakdown({
  breakdown, tasks, projects
}: {
  breakdown: Array<{ taskId: string; projectId: string; totalMinutes: number }>;
  tasks: Array<{ id: string; title: string }>;
  projects: Array<{ id: string; name: string }>;
}) {
  if (breakdown.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ margin: "0 0 8px", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-secondary)" }}>Time per task:</p>
      {breakdown.map((b) => {
        const task = tasks.find((t) => t.id === b.taskId);
        const project = projects.find((p) => p.id === b.projectId);
        const total = breakdown.reduce((s, x) => s + x.totalMinutes, 0) || 1;
        const pct = Math.round((b.totalMinutes / total) * 100);
        return (
          <div key={b.taskId}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)", fontWeight: 500 }}>{task?.title ?? b.taskId}</span>
                <span style={{ marginLeft: 8, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{project?.name}</span>
              </div>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-primary)" }}>{formatMinutes(b.totalMinutes)}</span>
            </div>
            <div style={{ height: 6, background: "var(--color-bg-canvas)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "var(--color-accent)", borderRadius: 3, transition: "width 0.5s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: "var(--color-bg-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  padding: 28,
};

const iconCircle: React.CSSProperties = {
  width: 48, height: 48, borderRadius: "50%",
  display: "flex", alignItems: "center", justifyContent: "center",
  flexShrink: 0,
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--color-bg-input)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  color: "var(--color-text-primary)",
  fontSize: "var(--text-sm)",
  padding: "10px 14px",
  outline: "none",
};

const primaryBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  background: "var(--color-accent)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-md)",
  padding: "10px 20px",
  fontSize: "var(--text-sm)",
  fontWeight: 600,
  cursor: "pointer",
};

const outlineBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  background: "transparent",
  color: "var(--color-text-primary)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  padding: "10px 20px",
  fontSize: "var(--text-sm)",
  fontWeight: 500,
  cursor: "pointer",
};





