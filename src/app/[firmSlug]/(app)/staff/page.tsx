"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth.store";
import { useStaff, useAddStaff } from "@/hooks/useStaff";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { format } from "date-fns";
import { toast } from "@/lib/store/toast.store";
import { getTimeInTimezone, isCheckInLate } from "@/lib/timezone";
import { X, Eye, EyeOff } from "lucide-react";

export default function StaffPage() {
  const params = useParams<{ firmSlug: string }>();
  const router = useRouter();
  const { user, firm } = useAuthStore();
  const firmId = firm?.id || "";

  // Queries
  const { data: staffList = [], isLoading: staffLoading } = useStaff(firmId);
  const { data: projects = [] } = useProjects(firmId);
  const { data: tasks = [] } = useTasks(firmId);

  // Mutations
  const addStaffMut = useAddStaff(firmId);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "late" | "absent">("all");

  // Admin Add Staff modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    designation: "",
    phone: "",
  });
  const [showAddPwd, setShowAddPwd] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = user?.role === "admin";
  const isTeamLead = user?.role === "team_lead";

  // Date and Timezone
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const todayDisplay = useMemo(() => format(new Date(), "EEE d MMM"), []);

  const firmPolicy = staffList[0]?.firmPolicy || (firm as any);
  const firmTimezone = firmPolicy?.timezone || (firm as any)?.timezone || "Asia/Kolkata";
  const firmOfficeStartTime = firmPolicy?.officeStartTime || (firm as any)?.officeStartTime || "09:15";

  // Derive status, workload, and task info for each staff member
  const processedStaff = useMemo(() => {
    return staffList.map((s: any) => {
      const session = s.attendanceSessions?.[0];
      const hasApprovedLeave = Boolean(
        s.todayApprovedLeave ||
        (s.leaveRequests &&
          s.leaveRequests.some(
            (l: any) => l.status === "approved" && l.startDate <= todayStr && l.endDate >= todayStr
          ))
      );

      let status: "present" | "late" | "absent" = "absent";
      let statusLabel = "Absent";
      let statusPillColor = "#F0626B";
      let checkInTimeFormatted = "—";

      if (hasApprovedLeave) {
        status = "absent";
        const leave = s.todayApprovedLeave || s.leaveRequests?.find((l: any) => l.status === "approved");
        statusLabel = "Absent · Leave";
        statusPillColor = "#F0626B";
      } else if (session && session.checkInTime) {
        const timeInfo = getTimeInTimezone(session.checkInTime, firmTimezone);
        checkInTimeFormatted = timeInfo.formatted;

        const late = isCheckInLate(session.checkInTime, firmOfficeStartTime, firmTimezone);
        if (late) {
          status = "late";
          statusLabel = `Late ${timeInfo.formatted}`;
          statusPillColor = "#F2B544";
        } else {
          status = "present";
          statusLabel = "Present";
          statusPillColor = "#3DD68C";
        }
      }

      // Current task and project
      let currentTaskTitle = "—";
      let currentProjectName = "—";
      if (session && (session.status === "working" || session.status === "on_break")) {
        const t = tasks.find((item: any) => item.id === session.currentTaskId);
        const p = projects.find((item: any) => item.id === session.currentProjectId);
        currentTaskTitle = t?.title || session.currentTaskId || "Active Task";
        currentProjectName = p?.name || session.currentProjectId || "Project";
      } else if (s.assignedTasks && s.assignedTasks.length > 0) {
        const firstTask = s.assignedTasks[0];
        currentTaskTitle = firstTask.title;
        currentProjectName = firstTask.project?.name || "Project";
      } else if (hasApprovedLeave) {
        currentTaskTitle = "—";
        const leave = s.todayApprovedLeave || s.leaveRequests?.find((l: any) => l.status === "approved");
        currentProjectName = leave?.endDate ? `Back ${format(new Date(leave.endDate), "MMM d")}` : "On Approved Leave";
      } else {
        currentTaskTitle = "—";
        currentProjectName = "Not checked in";
      }

      // Workload this week
      const openTasksCount = s.assignedTasks?.filter((t: any) => t.status !== "done")?.length ?? 0;
      let workload = 0;
      if (status !== "absent") {
        workload = Math.min(95, Math.max(35, openTasksCount * 22 || 50));
      }

      let workloadColor = "#3DD68C"; // < 70%
      if (workload >= 90) {
        workloadColor = "#F0626B";
      } else if (workload >= 70) {
        workloadColor = "#F2B544";
      }

      return {
        ...s,
        derivedStatus: status,
        statusLabel,
        statusPillColor,
        checkInTimeFormatted,
        currentTaskTitle,
        currentProjectName,
        workload,
        workloadColor,
      };
    });
  }, [staffList, tasks, projects, todayStr, firmTimezone, firmOfficeStartTime]);

  // Counts
  const totalCount = processedStaff.length;
  const presentCount = processedStaff.filter((s) => s.derivedStatus === "present").length;
  const lateCount = processedStaff.filter((s) => s.derivedStatus === "late").length;
  const absentCount = processedStaff.filter((s) => s.derivedStatus === "absent").length;
  const onLeaveCount = processedStaff.filter((s) => s.statusLabel.includes("Leave")).length;

  // Filtered rows
  const filteredStaff = useMemo(() => {
    return processedStaff.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.designation ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (s.role ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || s.derivedStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [processedStaff, search, statusFilter]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.password) {
      toast("Name, email and password are required", "error");
      return;
    }
    setActionLoading(true);
    try {
      await addStaffMut.mutateAsync(addForm);
      toast(`${addForm.name} added successfully`, "success");
      setShowAddModal(false);
      setAddForm({ name: "", email: "", password: "", role: "staff", designation: "", phone: "" });
    } catch (err: any) {
      toast(err.message || "Failed to add staff member", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredStaff.length === 0) {
      toast("No staff records to export", "warning");
      return;
    }
    const headers = ["Name", "Email", "Role", "Designation", "Status", "Working On", "Workload", "Check-in"];
    const rows = filteredStaff.map((s) => [
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.role}"`,
      `"${s.designation || ""}"`,
      `"${s.statusLabel}"`,
      `"${s.currentTaskTitle} (${s.currentProjectName})"`,
      `"${s.workload}%"`,
      `"${s.checkInTimeFormatted}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `arch_os_staff_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Staff list exported to CSV", "success");
  };

  return (
    <div className="staff-root">
      {/* Header */}
      <div className="staff-flex-row" style={{ justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div className="staff-label-caps">Arch OS · Team</div>
          <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 600 }}>Staff</h1>
        </div>
        <div className="staff-flex-row" style={{ gap: 10 }}>
          <button className="staff-btn-secondary" onClick={handleExportCSV}>
            Export
          </button>
          {isAdmin && (
            <button className="staff-btn-primary" onClick={() => setShowAddModal(true)}>
              + Add staff
            </button>
          )}
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="staff-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        <div className="staff-card" style={{ padding: "16px 20px" }}>
          <div className="staff-label-caps">Total staff</div>
          <div className="staff-flex-row" style={{ gap: 10, marginTop: 6 }}>
            <span className="staff-mono" style={{ fontSize: 32, color: "var(--staff-text)" }}>
              {totalCount}
            </span>
            <span className="staff-muted" style={{ fontSize: 12 }}>
              {todayDisplay}
            </span>
          </div>
        </div>

        <div className="staff-card" style={{ padding: "16px 20px" }}>
          <div className="staff-label-caps">Present</div>
          <div className="staff-flex-row" style={{ gap: 10, marginTop: 6 }}>
            <span className="staff-mono" style={{ fontSize: 32, color: "var(--staff-success)" }}>
              {presentCount}
            </span>
            <span className="staff-muted" style={{ fontSize: 12 }}>
              checked in
            </span>
          </div>
        </div>

        <div className="staff-card" style={{ padding: "16px 20px" }}>
          <div className="staff-label-caps">Late</div>
          <div className="staff-flex-row" style={{ gap: 10, marginTop: 6 }}>
            <span className="staff-mono" style={{ fontSize: 32, color: "var(--staff-warning)" }}>
              {lateCount}
            </span>
            <span className="staff-muted" style={{ fontSize: 12 }}>
              after {firmOfficeStartTime}
            </span>
          </div>
        </div>

        <div className="staff-card" style={{ padding: "16px 20px" }}>
          <div className="staff-label-caps">Absent</div>
          <div className="staff-flex-row" style={{ gap: 10, marginTop: 6 }}>
            <span className="staff-mono" style={{ fontSize: 32, color: "var(--staff-danger)" }}>
              {absentCount}
            </span>
            <span className="staff-muted" style={{ fontSize: 12 }}>
              {onLeaveCount > 0 ? `${onLeaveCount} approved leave` : "no check-in"}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters with Workload Legend */}
      <div className="staff-flex-row" style={{ gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div className="staff-card" style={{ padding: "0 14px", width: 320, display: "flex", alignItems: "center" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or role"
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              color: "var(--staff-text)",
              fontSize: 14,
              padding: "10px 0",
              outline: "none",
            }}
          />
        </div>

        <button
          onClick={() => setStatusFilter("all")}
          className="staff-pill"
          style={{
            color: "var(--staff-text)",
            borderColor: statusFilter === "all" ? "var(--staff-accent)" : "rgba(230,233,238,0.33)",
            background: statusFilter === "all" ? "rgba(232,163,61,0.14)" : "rgba(230,233,238,0.08)",
            cursor: "pointer",
          }}
        >
          All {totalCount}
        </button>

        <button
          onClick={() => setStatusFilter("present")}
          className="staff-pill"
          style={{
            color: "var(--staff-success)",
            borderColor: statusFilter === "present" ? "var(--staff-success)" : "rgba(61,214,140,0.33)",
            background: statusFilter === "present" ? "rgba(61,214,140,0.2)" : "rgba(61,214,140,0.08)",
            cursor: "pointer",
          }}
        >
          Present {presentCount}
        </button>

        <button
          onClick={() => setStatusFilter("late")}
          className="staff-pill"
          style={{
            color: "var(--staff-warning)",
            borderColor: statusFilter === "late" ? "var(--staff-warning)" : "rgba(242,181,68,0.33)",
            background: statusFilter === "late" ? "rgba(242,181,68,0.2)" : "rgba(242,181,68,0.08)",
            cursor: "pointer",
          }}
        >
          Late {lateCount}
        </button>

        <button
          onClick={() => setStatusFilter("absent")}
          className="staff-pill"
          style={{
            color: "var(--staff-danger)",
            borderColor: statusFilter === "absent" ? "var(--staff-danger)" : "rgba(240,98,107,0.33)",
            background: statusFilter === "absent" ? "rgba(240,98,107,0.2)" : "rgba(240,98,107,0.08)",
            cursor: "pointer",
          }}
        >
          Absent {absentCount}
        </button>

        <span style={{ flex: 1 }} />

        <span className="staff-muted" style={{ fontSize: 12 }}>
          Workload: <span style={{ color: "var(--staff-success)" }}>●</span> under 70%{" "}
          <span style={{ color: "var(--staff-warning)" }}>●</span> 70–89%{" "}
          <span style={{ color: "var(--staff-danger)" }}>●</span> 90%+
        </span>
      </div>

      {/* Staff Table Card */}
      <div className="staff-card">
        {/* Table Column Headers */}
        <div className="staff-table-row staff-label-caps" style={{ borderTop: 0, paddingTop: 12, paddingBottom: 12 }}>
          <div>Staff</div>
          <div>Status</div>
          <div>Working on now</div>
          <div>Workload this week</div>
          <div style={{ textAlign: "right" }}>Check-in</div>
        </div>

        {staffLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--staff-text-muted)" }}>
            Loading staff records...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--staff-text-muted)" }}>
            No staff records found matching your filters.
          </div>
        ) : (
          filteredStaff.map((s) => (
            <div
              key={s.id}
              className="staff-table-row"
              onClick={() => router.push(`/${params.firmSlug}/staff/${s.id}`)}
              style={{ cursor: "pointer" }}
            >
              {/* Staff Info */}
              <div className="staff-flex-row" style={{ gap: 12 }}>
                <div
                  className="staff-avatar"
                  style={{
                    width: 36,
                    height: 36,
                    fontSize: 13,
                    background: s.avatarColor || "var(--staff-border)",
                  }}
                >
                  {s.avatarInitials || s.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.name}
                  </div>
                  <div className="staff-muted" style={{ fontSize: 12, textTransform: "capitalize" }}>
                    {s.designation || s.role.replace("_", " ")}
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              <div>
                <span
                  className="staff-pill"
                  style={{
                    color: s.statusPillColor,
                    borderColor: `${s.statusPillColor}55`,
                    background: `${s.statusPillColor}14`,
                  }}
                >
                  ● {s.statusLabel}
                </span>
              </div>

              {/* Working on now */}
              <div>
                <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.currentTaskTitle}
                </div>
                <div className="staff-muted" style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.currentProjectName}
                </div>
              </div>

              {/* Workload this week */}
              <div className="staff-flex-row" style={{ gap: 10 }}>
                <div className="staff-bar-track">
                  <i style={{ width: `${s.workload}%`, background: s.workloadColor }} />
                </div>
                <span className="staff-mono" style={{ fontSize: 12, width: 34, textAlign: "right" }}>
                  {s.workload}%
                </span>
              </div>

              {/* Check-in */}
              <div className="staff-mono staff-muted" style={{ fontSize: 12, textAlign: "right" }}>
                {s.checkInTimeFormatted}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── ADD STAFF MODAL ── */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)" }} onClick={() => setShowAddModal(false)} />
          <div className="staff-card" style={{ position: "relative", width: 440, padding: 28, zIndex: 1 }}>
            <div className="staff-flex-row" style={{ justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--staff-text)" }}>Add New Staff</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--staff-text-muted)" }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddStaff}>
              <div>
                <label className="staff-label">Full Name *</label>
                <input
                  required
                  className="staff-input"
                  placeholder="e.g. Aarav Mehta"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="staff-label">Email Address *</label>
                <input
                  type="email"
                  required
                  className="staff-input"
                  placeholder="aarav@firm.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="staff-label">Designation</label>
                  <input
                    className="staff-input"
                    placeholder="e.g. Senior Architect"
                    value={addForm.designation}
                    onChange={(e) => setAddForm((f) => ({ ...f, designation: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="staff-label">Phone</label>
                  <input
                    className="staff-input"
                    placeholder="+91 9876543210"
                    value={addForm.phone}
                    onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="staff-label">Role *</label>
                <select
                  className="staff-input"
                  value={addForm.role}
                  onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="staff">Staff</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="accounts">Accounts</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="staff-label">Password *</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showAddPwd ? "text" : "password"}
                    required
                    className="staff-input"
                    placeholder="Min. 6 characters"
                    value={addForm.password}
                    onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                    style={{ paddingRight: 38 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPwd((v) => !v)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--staff-text-muted)" }}
                  >
                    {showAddPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="staff-flex-row" style={{ gap: 10, marginTop: 22 }}>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="staff-btn-primary"
                  style={{ flex: 1 }}
                >
                  {actionLoading ? "Adding..." : "+ Create Staff Member"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="staff-btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
