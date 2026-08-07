"use client";
/**
 * Time Tracker Page — Phase 5.3
 * Active session card (top, prominent), today's log table (editable),
 * Analytics: week bar chart (Recharts), project donut, phase breakdown.
 * Phase 5.4: team view (admin/lead toggle).
 */

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { format, parseISO, startOfWeek, addDays, isSameDay } from "date-fns";
import {
  Play,
  Square,
  Clock,
  BarChart2,
  Users,
  Trash2,
  ChevronDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useTimeStore } from "@/lib/store/time.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { Avatar } from "@/components/shared/Avatar";
import { toast } from "@/lib/store/toast.store";

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function useTickingTimer(startTime: string | null): string {
  const [elapsed, setElapsed] = useState("00:00:00");

  useEffect(() => {
    if (!startTime) { setElapsed("00:00:00"); return; }
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
      const s = String(diff % 60).padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return elapsed;
}

export default function TimePage() {
  const params = useParams<{ firmSlug: string }>();
  const { timeLogs, activeSessions, startClock, stopClock, deleteTimeLog } = useTimeStore();
  const { projects } = useProjectStore();
  const { user, firm } = useAuthStore();
  const { users } = useFirmStore();

  const [loading, setLoading] = useState(true);
  const [teamView, setTeamView] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("Design");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const mySession = user ? activeSessions.find((s) => s.userId === user.id) : null;
  const elapsed = useTickingTimer(mySession?.startTime ?? null);

  const firmProjects = projects.filter(
    (p) => p.firmId === firm?.id && p.status === "active"
  );

  const myLogs = timeLogs.filter(
    (l) => l.firmId === firm?.id && (teamView ? true : l.userId === user?.id)
  );

  const todayLogs = myLogs.filter((l) =>
    isSameDay(parseISO(l.date), new Date())
  );

  const todayMinutes = todayLogs.reduce(
    (sum, l) => sum + (l.durationMinutes ?? 0),
    0
  );

  // Week chart data
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const dayLabel = format(day, "EEE");
    const minutes = myLogs
      .filter((l) => isSameDay(parseISO(l.date), day))
      .reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
    return { day: dayLabel, hours: Math.round((minutes / 60) * 10) / 10 };
  });

  // Project donut
  const projectMinutes: Record<string, number> = {};
  myLogs.forEach((l) => {
    projectMinutes[l.projectId] = (projectMinutes[l.projectId] ?? 0) + (l.durationMinutes ?? 0);
  });
  const PIE_COLORS = ["var(--color-accent)", "#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6"];
  const pieData = Object.entries(projectMinutes)
    .map(([projectId, minutes]) => ({
      name: firmProjects.find((p) => p.id === projectId)?.name ?? "Unknown",
      value: Math.round(minutes / 60 * 10) / 10,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const phases = ["Concept", "Design", "Working Drawings", "Execution", "Closeout", "Admin", "Meeting", "Research"];

  const handleStart = () => {
    if (!user || !firm || !selectedProjectId) {
      toast("Select a project before starting", "error");
      return;
    }
    const success = startClock({
      userId: user.id,
      firmId: firm.id,
      projectId: selectedProjectId,
      phase: selectedPhase,
    });
    if (!success) {
      toast("You already have an active session — stop it first", "error");
    } else {
      toast(`Tracking started: ${selectedPhase}`, "success");
    }
  };

  const handleStop = () => {
    if (!user || !firm) return;
    stopClock(user.id, firm.id);
    toast("Time tracked and saved", "success");
  };

  const canSeeTeam = user?.role === "admin" || user?.role === "team_lead";

  if (loading) {
    return (
      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{ height: 120, background: "var(--color-bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        background: "var(--color-bg-canvas)",
        minHeight: "100%",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-text-primary)" }}>
          Time Tracker
        </h1>
        {canSeeTeam && (
          <div style={{ display: "flex", background: "var(--color-bg-input)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", padding: 2 }}>
            {(["My Time", "Team View"] as const).map((label, i) => (
              <button
                key={label}
                onClick={() => setTeamView(i === 1)}
                style={{
                  background: (i === 0 && !teamView) || (i === 1 && teamView) ? "var(--color-bg-card-hover)" : "transparent",
                  border: "none",
                  color: (i === 0 && !teamView) || (i === 1 && teamView) ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  padding: "6px 14px",
                  borderRadius: "calc(var(--radius-sm) - 2px)",
                  fontSize: "var(--text-sm)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {i === 1 ? <Users size={14} /> : <Clock size={14} />}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active session — top card */}
      {!teamView && (
        <div
          style={{
            background: mySession
              ? "linear-gradient(135deg, var(--color-accent), rgba(229,82,48,0.7))"
              : "var(--color-bg-card)",
            border: `1px solid ${mySession ? "transparent" : "var(--color-border)"}`,
            borderRadius: "var(--radius-lg)",
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
            boxShadow: mySession ? "0 8px 32px rgba(229,82,48,0.25)" : "none",
          }}
        >
          {mySession ? (
            <>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 40,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "0.05em",
                    lineHeight: 1,
                  }}
                >
                  {elapsed}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.8)" }}>
                  {firmProjects.find((p) => p.id === mySession.projectId)?.name ?? "Unknown project"} · {mySession.phase}
                </p>
              </div>
              <button
                onClick={handleStop}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "var(--radius-md)",
                  color: "#fff",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  padding: "12px 24px",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Square size={16} fill="#fff" />
                Stop Timer
              </button>
            </>
          ) : (
            <>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1 }}>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  style={{
                    background: "var(--color-bg-input)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--color-text-primary)",
                    fontSize: "var(--text-sm)",
                    padding: "9px 12px",
                    outline: "none",
                    flex: 1,
                    minWidth: 200,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                >
                  <option value="">Select project…</option>
                  {firmProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <select
                  value={selectedPhase}
                  onChange={(e) => setSelectedPhase(e.target.value)}
                  style={{
                    background: "var(--color-bg-input)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--color-text-primary)",
                    fontSize: "var(--text-sm)",
                    padding: "9px 12px",
                    outline: "none",
                    minWidth: 160,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                >
                  {phases.map((ph) => (
                    <option key={ph} value={ph}>{ph}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleStart}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--color-accent)",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  color: "#fff",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  padding: "12px 24px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <Play size={16} fill="#fff" />
                Start Timer
              </button>
            </>
          )}
        </div>
      )}

      {/* Today summary + Today's log */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-primary)" }}>
            Today's Log
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 10 }}>
              {formatDuration(todayMinutes)} total
            </span>
          </h3>
        </div>

        {todayLogs.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "32px 0",
              gap: 8,
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-muted)",
            }}
          >
            <Clock size={32} strokeWidth={1} opacity={0.4} />
            <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>No time tracked today</p>
          </div>
        ) : (
          <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                  {teamView && <th style={{ padding: "10px 14px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", textAlign: "left" }}>Person</th>}
                  <th style={{ padding: "10px 14px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", textAlign: "left" }}>Project</th>
                  <th style={{ padding: "10px 14px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", textAlign: "left" }}>Phase</th>
                  <th style={{ padding: "10px 14px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", textAlign: "left" }}>Start</th>
                  <th style={{ padding: "10px 14px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", textAlign: "left" }}>Duration</th>
                  <th style={{ padding: "10px 14px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)" }} />
                </tr>
              </thead>
              <tbody>
                {todayLogs.map((log) => {
                  const project = firmProjects.find((p) => p.id === log.projectId);
                  const person = users.find((u) => u.id === log.userId);
                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      {teamView && (
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Avatar name={person?.name ?? "?"} size="sm" />
                            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>{person?.name}</span>
                          </div>
                        </td>
                      )}
                      <td style={{ padding: "10px 14px", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {project?.name ?? "Unknown"}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        {log.phase}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                        {log.startTime ? format(parseISO(log.startTime), "h:mm a") : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {formatDuration(log.durationMinutes ?? 0)}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        {log.userId === user?.id && (
                          <button
                            onClick={() => {
                              deleteTimeLog(log.id);
                              toast("Time entry removed", "default");
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--color-text-muted)",
                              cursor: "pointer",
                              padding: 4,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-destructive)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
                            title="Remove entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Analytics — two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Week bar chart */}
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "20px",
          }}
        >
          <h4 style={{ margin: "0 0 16px", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
            This Week
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekData} barSize={24}>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                axisLine={false}
                tickLine={false}
                unit="h"
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 12,
                  color: "var(--color-text-primary)",
                }}
                cursor={{ fill: "var(--color-bg-input)" }}
                formatter={(v: any) => [`${v}h`, "Hours"]}
              />
              <Bar
                dataKey="hours"
                fill="var(--color-accent)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Project donut */}
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "20px",
          }}
        >
          <h4 style={{ margin: "0 0 16px", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
            By Project
          </h4>
          {pieData.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 180, color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 11,
                    color: "var(--color-text-primary)",
                  }}
                  formatter={(v: any) => [`${v}h`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          {/* Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {pieData.slice(0, 4).map((entry, i) => (
              <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: PIE_COLORS[i % PIE_COLORS.length],
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--color-text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                >
                  {entry.name}
                </span>
                <span style={{ fontSize: 10, color: "var(--color-text-secondary)", fontWeight: 600 }}>
                  {entry.value}h
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
