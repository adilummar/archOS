"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useTaskStore } from "@/lib/store/task.store";
import { getStaffWithAttendance, getTeamLeadStaffWithAttendance } from "@/app/actions/staff.actions";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { Avatar } from "@/components/shared/Avatar";
import { useRouter, useParams } from "next/navigation";
import { Search, Users, Clock, Coffee, CheckCircle2, LogOut, UserX, LayoutGrid, List } from "lucide-react";
import { format } from "date-fns";

type StaffWithAttendance = Awaited<ReturnType<typeof getStaffWithAttendance>>;

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
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{h}:{m}:{s}</span>;
}

function AttendanceStatus({ session }: { session: StaffWithAttendance[0]["attendanceSessions"][0] | undefined }) {
  if (!session) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-text-muted)" }} />
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Not checked in</span>
      </div>
    );
  }

  const statusColor =
    session.status === "working" ? "#06D6A0"
    : session.status === "on_break" ? "#FFB703"
    : "var(--color-text-muted)";

  const statusLabel =
    session.status === "working" ? "Working"
    : session.status === "on_break" ? "On Break"
    : "Checked Out";

  const StatusIcon =
    session.status === "working" ? Clock
    : session.status === "on_break" ? Coffee
    : CheckCircle2;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor,
        boxShadow: session.status === "working" ? `0 0 6px ${statusColor}` : "none",
      }} />
      <StatusIcon size={12} color={statusColor} />
      <span style={{ fontSize: "var(--text-xs)", color: statusColor, fontWeight: 600 }}>
        {statusLabel}
      </span>
    </div>
  );
}

export default function StaffPage() {
  const params = useParams<{ firmSlug: string }>();
  const router = useRouter();
  const { user, firm } = useAuthStore();
  const { projects } = useProjectStore();
  const { tasks } = useTaskStore();

  const [staff, setStaff] = useState<StaffWithAttendance>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const isAdmin = user?.role === "admin";
  const isTeamLead = user?.role === "team_lead";

  const load = useCallback(async () => {
    if (!user || !firm) return;
    try {
      if (isAdmin) {
        const data = await getStaffWithAttendance(firm.id, user.email);
        setStaff(data);
      } else if (isTeamLead) {
        const data = await getTeamLeadStaffWithAttendance(user.id, user.email);
        setStaff(data as unknown as StaffWithAttendance);
      }
    } finally {
      setLoading(false);
    }
  }, [user, firm, isAdmin, isTeamLead]);

  useEffect(() => {
    load();
    // Auto-refresh every 30 seconds to update live status
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = staff.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.designation ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Split into groups
  const working = filtered.filter((s) => s.attendanceSessions[0]?.status === "working");
  const onBreak = filtered.filter((s) => s.attendanceSessions[0]?.status === "on_break");
  const checkedOut = filtered.filter((s) => s.attendanceSessions[0]?.status === "checked_out");
  const notIn = filtered.filter((s) => !s.attendanceSessions[0]);

  const totalPresent = working.length + onBreak.length + checkedOut.length;

  if (!user || (!isAdmin && !isTeamLead)) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>
        You don't have access to the Staff section.
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
          Staff
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
          {isTeamLead ? "Staff working on your projects" : "All staff in the firm"} · {format(new Date(), "EEEE, MMMM d")}
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total", value: filtered.length, color: "var(--color-text-primary)" },
          { label: "Working", value: working.length, color: "#06D6A0" },
          { label: "On Break", value: onBreak.length, color: "#FFB703" },
          { label: "Not In", value: notIn.length, color: "var(--color-text-muted)" },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "14px 18px",
          }}>
            <p style={{ margin: "0 0 2px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{stat.label}</p>
            <p style={{ margin: 0, fontSize: "var(--text-2xl)", fontWeight: 800, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search and View Toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ position: "relative", width: 340 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff..."
            style={{
              width: "100%",
              paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
              background: "var(--color-bg-input)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-primary)",
              fontSize: "var(--text-sm)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        
        {/* Toggle */}
        <div style={{ display: "flex", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 4 }}>
          <button onClick={() => setViewMode("grid")} style={{ padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "none", background: viewMode === "grid" ? "var(--color-bg-canvas)" : "transparent", color: viewMode === "grid" ? "var(--color-text-primary)" : "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setViewMode("list")} style={{ padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "none", background: viewMode === "list" ? "var(--color-bg-canvas)" : "transparent", color: viewMode === "list" ? "var(--color-text-primary)" : "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <List size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonCard count={4} height={130} />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--color-text-muted)" }}>
          <Users size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ margin: 0 }}>No staff found</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Working group */}
          {working.length > 0 && (
            <StaffGroup title="Working Now" color="#06D6A0" members={working} firmSlug={params.firmSlug} projects={projects} tasks={tasks} router={router} viewMode={viewMode} />
          )}
          {/* On break */}
          {onBreak.length > 0 && (
            <StaffGroup title="On Break" color="#FFB703" members={onBreak} firmSlug={params.firmSlug} projects={projects} tasks={tasks} router={router} viewMode={viewMode} />
          )}
          {/* Checked out */}
          {checkedOut.length > 0 && (
            <StaffGroup title="Checked Out" color="var(--color-text-secondary)" members={checkedOut} firmSlug={params.firmSlug} projects={projects} tasks={tasks} router={router} viewMode={viewMode} />
          )}
          {/* Not in */}
          {notIn.length > 0 && (
            <StaffGroup title="Not Checked In" color="var(--color-text-muted)" members={notIn} firmSlug={params.firmSlug} projects={projects} tasks={tasks} router={router} viewMode={viewMode} />
          )}
        </div>
      )}
    </div>
  );
}

// ── STAFF GROUP ───────────────────────────────────────────────────────────────
function StaffGroup({
  title, color, members, firmSlug, projects, tasks, router, viewMode
}: {
  title: string;
  color: string;
  members: StaffWithAttendance;
  firmSlug: string;
  projects: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string }>;
  router: ReturnType<typeof useRouter>;
  viewMode: "grid" | "list";
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {title} ({members.length})
        </span>
      </div>
      <div style={
        viewMode === "grid"
          ? { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }
          : { display: "flex", flexDirection: "column", gap: 8 }
      }>
        {members.map((s) => (
          <StaffCard
            key={s.id}
            staff={s}
            firmSlug={firmSlug}
            projects={projects}
            tasks={tasks}
            onClick={() => router.push(`/${firmSlug}/staff/${s.id}`)}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
}

// ── STAFF CARD ────────────────────────────────────────────────────────────────
function StaffCard({
  staff, firmSlug, projects, tasks, onClick, viewMode
}: {
  staff: StaffWithAttendance[0];
  firmSlug: string;
  projects: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string }>;
  onClick: () => void;
  viewMode?: "grid" | "list";
}) {
  const session = staff.attendanceSessions[0];
  const currentProject = projects.find((p) => p.id === session?.currentProjectId);
  const currentTask = tasks.find((t) => t.id === session?.currentTaskId);

  if (viewMode === "list") {
    return (
      <div
        onClick={onClick}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          cursor: "pointer", gap: 16,
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-accent)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.12)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        }}
      >
        {/* Avatar and Info */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, width: 250 }}>
          <Avatar
            name={staff.name}
            initials={staff.avatarInitials ?? staff.name.slice(0, 2).toUpperCase()}
            color={staff.avatarColor ?? "#E85D04"}
            size="md"
          />
          <div>
            <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {staff.name}
            </p>
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
              {staff.designation ?? staff.role}
            </p>
          </div>
        </div>
        
        {/* Status & Timer */}
        <div style={{ width: 140 }}>
          <AttendanceStatus session={session} />
          {session?.status === "working" && (
            <div style={{ fontSize: "var(--text-xs)", color: "#06D6A0", fontWeight: 700, marginTop: 4, paddingLeft: 14 }}>
              <LiveTimer checkInTime={new Date(session.checkInTime)} />
            </div>
          )}
        </div>

        {/* Current Task */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {session && (session.status === "working" || session.status === "on_break") ? (
            <div>
              <p style={{ margin: "0 0 2px", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {currentTask?.title ?? session.currentTaskId ?? "—"}
              </p>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {currentProject?.name ?? session.currentProjectId ?? "—"}
              </p>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
              {session?.status === "checked_out" ? <><LogOut size={13}/> Checked out</> : <><UserX size={13}/> Not in</>}
            </p>
          )}
        </div>

        {/* Tasks count */}
        <div style={{ width: 100, textAlign: "right", flexShrink: 0 }}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {staff.assignedTasks.length > 0 ? `${staff.assignedTasks.length} open tasks` : "No tasks"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "18px 20px",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-accent)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Top row: avatar + name + status */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <Avatar
          name={staff.name}
          initials={staff.avatarInitials ?? staff.name.slice(0, 2).toUpperCase()}
          color={staff.avatarColor ?? "#E85D04"}
          size="lg"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "var(--text-base)", color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {staff.name}
          </p>
          <p style={{ margin: "0 0 6px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {staff.designation ?? staff.role}
          </p>
          <AttendanceStatus session={session} />
        </div>
        {session?.status === "working" && (
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "#06D6A0", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
            <LiveTimer checkInTime={new Date(session.checkInTime)} />
          </div>
        )}
      </div>

      {/* Today's task info */}
      {session && (session.status === "working" || session.status === "on_break") ? (
        <div style={{
          background: "var(--color-bg-canvas)",
          borderRadius: "var(--radius-sm)",
          padding: "10px 12px",
          border: "1px solid var(--color-border)",
        }}>
          <p style={{ margin: "0 0 2px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
            {session.status === "on_break" ? "Was working on" : "Working on"}
          </p>
          <p style={{ margin: "0 0 2px", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {currentTask?.title ?? session.currentTaskId ?? "—"}
          </p>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {currentProject?.name ?? session.currentProjectId ?? "—"}
          </p>
        </div>
      ) : session?.status === "checked_out" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogOut size={13} color="var(--color-text-muted)" />
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            Checked out · Work: {formatMinutes(session.totalWorkMinutes)}
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <UserX size={13} color="var(--color-text-muted)" />
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            No attendance today
          </span>
        </div>
      )}

      {/* Open tasks count */}
      {staff.assignedTasks.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {staff.assignedTasks.length} open task{staff.assignedTasks.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

