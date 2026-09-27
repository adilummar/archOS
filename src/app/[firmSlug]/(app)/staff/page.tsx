"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useTaskStore } from "@/lib/store/task.store";
import { getStaffWithAttendance, getTeamLeadStaffWithAttendance, addStaffMember, suspendStaffMember, unsuspendStaffMember, changeStaffPassword } from "@/app/actions/staff.actions";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { Avatar } from "@/components/shared/Avatar";
import { useRouter, useParams } from "next/navigation";
import { Search, Users, Clock, Coffee, CheckCircle2, LogOut, UserX, LayoutGrid, List, Plus, KeyRound, ShieldOff, ShieldCheck, X, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/lib/store/toast.store";

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

  // Admin modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState<{ id: string; name: string; status: string } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<{ id: string; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add staff form
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "", role: "staff", designation: "", phone: "" });
  const [showAddPwd, setShowAddPwd] = useState(false);

  // Change password form
  const [newPassword, setNewPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);

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

  const handleAddStaff = async () => {
    if (!addForm.name || !addForm.email || !addForm.password) {
      toast("Name, email and password are required", "error"); return;
    }
    setActionLoading(true);
    try {
      await addStaffMember({ ...addForm, firmId: firm?.id || "" });
      toast(`${addForm.name} added successfully`, "success");
      setShowAddModal(false);
      setAddForm({ name: "", email: "", password: "", role: "staff", designation: "", phone: "" });
      load();
    } catch (e: any) {
      toast(e.message || "Failed to add staff", "error");
    } finally { setActionLoading(false); }
  };

  const handleToggleSuspend = async () => {
    if (!showSuspendModal) return;
    setActionLoading(true);
    try {
      if (showSuspendModal.status === "active") {
        await suspendStaffMember(showSuspendModal.id);
        toast(`${showSuspendModal.name} has been suspended`, "success");
      } else {
        await unsuspendStaffMember(showSuspendModal.id);
        toast(`${showSuspendModal.name} has been reinstated`, "success");
      }
      setShowSuspendModal(null);
      load();
    } catch (e: any) {
      toast(e.message || "Action failed", "error");
    } finally { setActionLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!showPasswordModal || !newPassword) return;
    if (newPassword.length < 6) { toast("Password must be at least 6 characters", "error"); return; }
    setActionLoading(true);
    try {
      await changeStaffPassword(showPasswordModal.id, newPassword);
      toast(`Password changed for ${showPasswordModal.name}`, "success");
      setShowPasswordModal(null);
      setNewPassword("");
    } catch (e: any) {
      toast(e.message || "Failed to change password", "error");
    } finally { setActionLoading(false); }
  };

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
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
              Staff
            </h1>
            <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
              {isTeamLead ? "Staff working on your projects" : "All staff in the firm"} · {format(new Date(), "EEEE, MMMM d")}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 16px",
                background: "var(--color-accent)", color: "#fff",
                border: "none", borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)", fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={16} /> Add Staff
            </button>
          )}
        </div>
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
            <StaffGroup title="Working Now" isAdmin={isAdmin} onSuspend={setShowSuspendModal} onChangePassword={setShowPasswordModal} color="#06D6A0" members={working} firmSlug={params.firmSlug} projects={projects} tasks={tasks} router={router} viewMode={viewMode} />
          )}
          {/* On break */}
          {onBreak.length > 0 && (
            <StaffGroup title="On Break" isAdmin={isAdmin} onSuspend={setShowSuspendModal} onChangePassword={setShowPasswordModal} color="#FFB703" members={onBreak} firmSlug={params.firmSlug} projects={projects} tasks={tasks} router={router} viewMode={viewMode} />
          )}
          {/* Checked out */}
          {checkedOut.length > 0 && (
            <StaffGroup title="Checked Out" isAdmin={isAdmin} onSuspend={setShowSuspendModal} onChangePassword={setShowPasswordModal} color="var(--color-text-secondary)" members={checkedOut} firmSlug={params.firmSlug} projects={projects} tasks={tasks} router={router} viewMode={viewMode} />
          )}
          {/* Not in */}
          {notIn.length > 0 && (
            <StaffGroup title="Not Checked In" isAdmin={isAdmin} onSuspend={setShowSuspendModal} onChangePassword={setShowPasswordModal} color="var(--color-text-muted)" members={notIn} firmSlug={params.firmSlug} projects={projects} tasks={tasks} router={router} viewMode={viewMode} />
          )}
        </div>
      )}
    </div>
  );
}


      {/* ── ADD STAFF MODAL ── */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setShowAddModal(false)} />
          <div style={{ position: "relative", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 28, width: 420, zIndex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700 }}>Add New Staff</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {([
                { label: "Full Name *", key: "name", type: "text", placeholder: "e.g. Aisha Malik" },
                { label: "Email Address *", key: "email", type: "email", placeholder: "aisha@firm.com" },
                { label: "Designation", key: "designation", type: "text", placeholder: "e.g. Architect" },
                { label: "Phone", key: "phone", type: "text", placeholder: "+91 9876543210" },
              ] as const).map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: 4, color: "var(--color-text-secondary)" }}>{label}</label>
                  <input type={type} value={addForm[key as keyof typeof addForm]} placeholder={placeholder}
                    onChange={(e) => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: 4, color: "var(--color-text-secondary)" }}>Role *</label>
                <select value={addForm.role} onChange={(e) => setAddForm(f => ({ ...f, role: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)" }}>
                  <option value="staff">Staff</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="accounts">Accounts</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: 4, color: "var(--color-text-secondary)" }}>Password *</label>
                <div style={{ position: "relative" }}>
                  <input type={showAddPwd ? "text" : "password"} value={addForm.password} placeholder="Min. 6 characters"
                    onChange={(e) => setAddForm(f => ({ ...f, password: e.target.value }))}
                    style={{ width: "100%", padding: "8px 36px 8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)", boxSizing: "border-box" }} />
                  <button onClick={() => setShowAddPwd(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                    {showAddPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button onClick={handleAddStaff} disabled={actionLoading}
                style={{ marginTop: 6, padding: "10px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "var(--text-sm)", cursor: actionLoading ? "not-allowed" : "pointer", opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? "Adding..." : "Add Staff Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUSPEND / REINSTATE MODAL ── */}
      {showSuspendModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => setShowSuspendModal(null)} />
          <div style={{ position: "relative", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 28, width: 380, zIndex: 1, textAlign: "center" }}>
            <div style={{ marginBottom: 16 }}>
              {showSuspendModal.status === "active"
                ? <ShieldOff size={36} color="#E63946" style={{ margin: "0 auto 10px", display: "block" }} />
                : <ShieldCheck size={36} color="#06D6A0" style={{ margin: "0 auto 10px", display: "block" }} />}
              <h2 style={{ margin: "0 0 6px", fontSize: "var(--text-lg)", fontWeight: 700 }}>
                {showSuspendModal.status === "active" ? "Suspend Staff Member?" : "Reinstate Staff Member?"}
              </h2>
              <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                {showSuspendModal.status === "active"
                  ? showSuspendModal.name + " will lose access immediately."
                  : showSuspendModal.name + " will regain access to the platform."}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setShowSuspendModal(null)} style={{ padding: "9px 20px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", color: "var(--color-text-primary)", fontWeight: 600 }}>Cancel</button>
              <button onClick={handleToggleSuspend} disabled={actionLoading}
                style={{ padding: "9px 20px", background: showSuspendModal.status === "active" ? "#E63946" : "#06D6A0", color: "#fff", border: "none", borderRadius: "var(--radius-md)", cursor: actionLoading ? "not-allowed" : "pointer", fontWeight: 700, opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? "Processing..." : (showSuspendModal.status === "active" ? "Yes, Suspend" : "Yes, Reinstate")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CHANGE PASSWORD MODAL ── */}
      {showPasswordModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={() => { setShowPasswordModal(null); setNewPassword(""); }} />
          <div style={{ position: "relative", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 28, width: 380, zIndex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700 }}>Change Password</h2>
              <button onClick={() => { setShowPasswordModal(null); setNewPassword(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><X size={18} /></button>
            </div>
            <p style={{ margin: "0 0 14px", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
              Setting a new password for <strong>{showPasswordModal.name}</strong>.
            </p>
            <div>
              <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: 4, color: "var(--color-text-secondary)" }}>New Password</label>
              <div style={{ position: "relative" }}>
                <input type={showNewPwd ? "text" : "password"} value={newPassword} placeholder="Min. 6 characters"
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: "100%", padding: "8px 36px 8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)", boxSizing: "border-box" }} />
                <button onClick={() => setShowNewPwd(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                  {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button onClick={handleChangePassword} disabled={actionLoading || !newPassword}
              style={{ marginTop: 14, width: "100%", padding: "10px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "var(--text-sm)", cursor: (actionLoading || !newPassword) ? "not-allowed" : "pointer", opacity: (actionLoading || !newPassword) ? 0.7 : 1 }}>
              {actionLoading ? "Saving..." : "Change Password"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── STAFF GROUP ───────────────────────────────────────────────────────────────
function StaffGroup({
  title, color, members, firmSlug, projects, tasks, router, viewMode, isAdmin, onSuspend, onChangePassword
}: {
  title: string;
  color: string;
  members: StaffWithAttendance;
  firmSlug: string;
  projects: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string }>;
  router: ReturnType<typeof useRouter>;
  viewMode: "grid" | "list";
  isAdmin?: boolean;
  onSuspend?: (m: { id: string; name: string; status: string }) => void;
  onChangePassword?: (m: { id: string; name: string }) => void;
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
            isAdmin={isAdmin}
            onSuspend={onSuspend}
            onChangePassword={onChangePassword}
          />
        ))}
      </div>
    </div>
  );
}

// ── STAFF CARD ────────────────────────────────────────────────────────────────
function StaffCard({
  staff, firmSlug, projects, tasks, onClick, viewMode, isAdmin, onSuspend, onChangePassword
}: {
  staff: StaffWithAttendance[0];
  firmSlug: string;
  projects: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string }>;
  onClick: () => void;
  viewMode?: "grid" | "list";
  isAdmin?: boolean;
  onSuspend?: (m: { id: string; name: string; status: string }) => void;
  onChangePassword?: (m: { id: string; name: string }) => void;
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

      {/* Admin action buttons */}
      {isAdmin && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--color-border)", display: "flex", gap: 8 }}
          onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onChangePassword?.({ id: staff.id, name: staff.name })}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 10px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", cursor: "pointer", fontWeight: 600 }}
          >
            <KeyRound size={12} /> Password
          </button>
          <button
            onClick={() => onSuspend?.({ id: staff.id, name: staff.name, status: staff.status })}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 10px", background: "transparent", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: staff.status === "active" ? "#E63946" : "#06D6A0", fontSize: "var(--text-xs)", cursor: "pointer", fontWeight: 600 }}
          >
            {staff.status === "active" ? <><ShieldOff size={12} /> Suspend</> : <><ShieldCheck size={12} /> Reinstate</>}
          </button>
        </div>
      )}
    </div>
  );
}

