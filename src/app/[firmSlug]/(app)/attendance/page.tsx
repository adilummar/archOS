"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth.store";
import { useStaff, useStaffProfile } from "@/hooks/useStaff";
import {
  useWeeklyAttendance,
  useMyAttendance,
  useAttendanceHistory,
  useTaskTimeBreakdown,
  useAttendanceMutations,
} from "@/hooks/useAttendance";
import { useLeaveRequests, useLeaveMutations } from "@/hooks/useLeave";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "@/lib/store/toast.store";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import {
  LogIn,
  Coffee,
  Play,
  LogOut,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Plus,
  X,
  Search,
  Filter,
} from "lucide-react";
import { getTimeInTimezone, isCheckInLate } from "@/lib/timezone";

type TabKey = "daily" | "weekly" | "leave" | "my";

function formatMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function LiveTimer({ startTime }: { startTime: Date | string }) {
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
    <span style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>
      {h}:{m}:{s}
    </span>
  );
}

export default function AttendancePage() {
  const router = useRouter();
  const params = useParams<{ firmSlug: string }>();
  const searchParams = useSearchParams();
  const { user, firm } = useAuthStore();
  const firmId = firm?.id || "";
  const userId = user?.id || "";

  const isAdmin = user?.role === "admin";
  const isTeamLead = user?.role === "team_lead";
  const isPrivileged = isAdmin || isTeamLead || user?.role === "accounts";

  // Tab state
  const rawTab = searchParams.get("tab");
  const initialTab: TabKey =
    rawTab === "leave"
      ? "leave"
      : rawTab === "weekly"
      ? "weekly"
      : rawTab === "my"
      ? "my"
      : rawTab === "attendance" || rawTab === "daily"
      ? "daily"
      : isPrivileged
      ? "daily"
      : "my";

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    router.replace(`/${params.firmSlug}/attendance?tab=${tab}`, { scroll: false });
  };

  // ── Queries ──
  const { data: staffList = [], isLoading: staffLoading } = useStaff(firmId);
  const { data: weeklyData = [] } = useWeeklyAttendance(firmId);
  const { data: leaveRequests = [], isLoading: leaveLoading } = useLeaveRequests(firmId);
  const { data: session, isLoading: sessionLoading } = useMyAttendance(firmId, userId);
  const { data: history = [] } = useAttendanceHistory(firmId, userId);
  const { data: taskBreakdown = [] } = useTaskTimeBreakdown(session?.id || "");
  const { data: projects = [] } = useProjects(firmId);
  const { data: tasks = [] } = useTasks(firmId);

  // ── Mutations ──
  const leaveMutations = useLeaveMutations(firmId);
  const attMuts = useAttendanceMutations(firmId, userId);

  // ── Daily Tab State ──
  const [attendanceFilter, setAttendanceFilter] = useState<"all" | "late" | "on_leave" | "absent">("all");
  const [staffSearch, setStaffSearch] = useState("");

  // ── Personal Clock-In State ──
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [switching, setSwitching] = useState(false);
  const [switchProjectId, setSwitchProjectId] = useState<string>("");
  const [switchTaskId, setSwitchTaskId] = useState<string>("");
  const [submittingAtt, setSubmittingAtt] = useState(false);

  // ── Leave Tab State ──
  const [leaveFilter, setLeaveFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showCreateLeaveModal, setShowCreateLeaveModal] = useState(false);
  const [createLeaveForm, setCreateLeaveForm] = useState({
    type: "annual",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    reason: "",
  });
  const [actionLoading, setActionLoading] = useState(false);

  // ── Dates and Times ──
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const todayDateFormatted = useMemo(() => format(new Date(), "EEEE, d MMMM yyyy"), []);

  // Firm attendance policy defaults
  const firmPolicy = staffList[0]?.firmPolicy || (firm as any);
  const firmTimezone = firmPolicy?.timezone || (firm as any)?.timezone || "Asia/Kolkata";
  const firmOfficeStartTime = firmPolicy?.officeStartTime || (firm as any)?.officeStartTime || "09:15";
  const firmWorkweekDays: number[] = firmPolicy?.workweekDays || (firm as any)?.workweekDays || [1, 2, 3, 4, 5];

  // Classify each staff member's attendance today
  const classifiedStaff = useMemo(() => {
    return staffList.map((s: any) => {
      const sess = s.attendanceSessions?.[0];
      const hasApprovedLeave = Boolean(
        s.todayApprovedLeave ||
        (s.leaveRequests &&
          s.leaveRequests.some(
            (l: any) => l.status === "approved" && l.startDate <= todayStr && l.endDate >= todayStr
          ))
      );

      let status: "present" | "late" | "on_leave" | "absent" = "absent";
      let inTime = "—";
      let outTime = "—";
      let hoursWorked = "—";

      if (hasApprovedLeave) {
        status = "on_leave";
      } else if (sess && sess.checkInTime) {
        const checkInInfo = getTimeInTimezone(sess.checkInTime, firmTimezone);
        inTime = checkInInfo.formatted;

        const isLate = isCheckInLate(sess.checkInTime, firmOfficeStartTime, firmTimezone);
        status = isLate ? "late" : "present";

        if (sess.checkOutTime) {
          outTime = getTimeInTimezone(sess.checkOutTime, firmTimezone).formatted;
          const mins = sess.totalWorkMinutes || 0;
          hoursWorked = formatMinutes(mins);
        } else {
          hoursWorked = "Active";
        }
      }

      return {
        ...s,
        derivedStatus: status,
        inTime,
        outTime,
        hoursWorked,
        session: sess,
      };
    });
  }, [staffList, todayStr, firmTimezone, firmOfficeStartTime]);

  // Derived counts
  const totalStaffCount = staffList.length;
  const presentCount = classifiedStaff.filter((s: any) => s.derivedStatus === "present").length;
  const lateCount = classifiedStaff.filter((s: any) => s.derivedStatus === "late").length;
  const onLeaveCount = classifiedStaff.filter((s: any) => s.derivedStatus === "on_leave").length;
  const absentCount = classifiedStaff.filter((s: any) => s.derivedStatus === "absent").length;

  const filteredAttendanceStaff = useMemo(() => {
    return classifiedStaff.filter((s: any) => {
      const matchFilter = attendanceFilter === "all" || s.derivedStatus === attendanceFilter;
      const matchSearch =
        s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
        (s.designation ?? "").toLowerCase().includes(staffSearch.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [classifiedStaff, attendanceFilter, staffSearch]);

  // Leave derivations
  const pendingLeaveRequests = useMemo(() => {
    return leaveRequests.filter((r: any) => r.status === "pending");
  }, [leaveRequests]);

  const filteredLeaves = useMemo(() => {
    if (leaveFilter === "all") return leaveRequests;
    return leaveRequests.filter((r: any) => r.status === leaveFilter);
  }, [leaveRequests, leaveFilter]);

  const activeSelectedLeave = useMemo(() => {
    if (selectedLeaveId) {
      const found = leaveRequests.find((r: any) => r.id === selectedLeaveId);
      if (found) return found;
    }
    return pendingLeaveRequests[0] || leaveRequests[0] || null;
  }, [leaveRequests, pendingLeaveRequests, selectedLeaveId]);

  // Clash Strip Days
  const clashStripDays = useMemo(() => {
    if (!activeSelectedLeave?.startDate || !activeSelectedLeave?.endDate) return [];
    try {
      const start = parseISO(activeSelectedLeave.startDate);
      const end = parseISO(activeSelectedLeave.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];
      const interval = eachDayOfInterval({ start, end });
      return interval.map((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        const weekday = format(d, "EEE");
        const dayNum = format(d, "dd");
        const dayClashes = (activeSelectedLeave.submissionClashes || []).filter((c: any) => {
          if (!c.dueDate) return false;
          return c.dueDate.startsWith(dateStr) || isSameDay(parseISO(c.dueDate), d);
        });
        return {
          dateStr,
          weekday,
          dayNum,
          hasSubmissionClash: dayClashes.length > 0,
          clashes: dayClashes,
        };
      });
    } catch {
      return [];
    }
  }, [activeSelectedLeave]);

  // Tasks assigned to logged in user for project
  const tasksForProject = (pid: string) =>
    tasks.filter(
      (t: any) =>
        t.projectId === pid &&
        (isAdmin || t.assigneeId === userId) &&
        ["assigned", "active", "revision_requested", "todo", "in_progress"].includes(t.status)
    );

  // ── Actions ──
  const handleCheckIn = async () => {
    if (!selectedProjectId || !selectedTaskId) {
      toast("Please select a project and task to check in", "error");
      return;
    }
    setSubmittingAtt(true);
    try {
      await attMuts.checkIn.mutateAsync({
        projectId: selectedProjectId,
        taskId: selectedTaskId,
      });
      toast("Checked in! Have a productive session", "success");
    } catch (e: any) {
      toast(e.message || "Failed to check in", "error");
    } finally {
      setSubmittingAtt(false);
    }
  };

  const handleSwitchTask = async () => {
    if (!switchProjectId || !switchTaskId) {
      toast("Please select a project and task to switch to", "error");
      return;
    }
    setSubmittingAtt(true);
    try {
      await attMuts.switchTask.mutateAsync({
        projectId: switchProjectId,
        taskId: switchTaskId,
      });
      toast("Task switched successfully", "success");
      setSwitching(false);
      setSwitchProjectId("");
      setSwitchTaskId("");
    } catch (e: any) {
      toast(e.message || "Failed to switch task", "error");
    } finally {
      setSubmittingAtt(false);
    }
  };

  const handleTakeBreak = async () => {
    if (!session?.id) return;
    try {
      await attMuts.startBreak.mutateAsync({ sessionId: session.id, type: "short" });
      toast("Break started", "warning");
    } catch (e: any) {
      toast(e.message || "Failed to start break", "error");
    }
  };

  const handleResumeWork = async () => {
    if (!session?.id) return;
    try {
      await attMuts.endBreak.mutateAsync({ sessionId: session.id });
      toast("Resumed work", "success");
    } catch (e: any) {
      toast(e.message || "Failed to resume work", "error");
    }
  };

  const handleCheckOut = async () => {
    if (!session?.id) return;
    try {
      await attMuts.checkOut.mutateAsync({ sessionId: session.id });
      toast("Checked out! Well done today", "success");
    } catch (e: any) {
      toast(e.message || "Failed to check out", "error");
    }
  };

  const handleApproveLeave = async (id: string) => {
    try {
      await leaveMutations.approveLeave.mutateAsync({ id });
      toast("Leave request approved", "success");
    } catch (err: any) {
      toast(err.message || "Failed to approve leave", "error");
    }
  };

  const handleConfirmReject = async () => {
    if (!showRejectModal) return;
    if (!rejectReason.trim()) {
      toast("Rejection reason is required", "error");
      return;
    }
    try {
      await leaveMutations.rejectLeave.mutateAsync({
        id: showRejectModal.id,
        note: rejectReason.trim(),
      });
      toast("Leave request rejected", "warning");
      setShowRejectModal(null);
      setRejectReason("");
    } catch (err: any) {
      toast(err.message || "Failed to reject leave", "error");
    }
  };

  const handleCreateLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createLeaveForm.startDate || !createLeaveForm.endDate) {
      toast("Please specify start and end dates", "error");
      return;
    }
    setActionLoading(true);
    try {
      await leaveMutations.createLeave.mutateAsync(createLeaveForm);
      toast("Leave request submitted successfully", "success");
      setShowCreateLeaveModal(false);
      setCreateLeaveForm({
        type: "annual",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(new Date(), "yyyy-MM-dd"),
        reason: "",
      });
    } catch (err: any) {
      toast(err.message || "Failed to submit leave request", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
              Attendance
            </h1>
            <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
              Firm presence · daily timekeeping · leave management · {todayDateFormatted}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setShowCreateLeaveModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px",
                background: "var(--color-accent)", color: "#fff",
                border: "none", borderRadius: "var(--radius-md)",
                fontSize: "var(--text-sm)", fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={15} /> Request Leave
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--color-border)", marginTop: 20 }}>
          {isPrivileged && (
            <button
              onClick={() => switchTab("daily")}
              style={{
                border: "none", background: "none",
                color: activeTab === "daily" ? "#fff" : "var(--color-text-muted)",
                fontSize: 14, fontWeight: 600,
                padding: "10px 0",
                borderBottom: `2px solid ${activeTab === "daily" ? "var(--color-accent)" : "transparent"}`,
                cursor: "pointer",
              }}
            >
              Today's Attendance
            </button>
          )}

          {isPrivileged && (
            <button
              onClick={() => switchTab("weekly")}
              style={{
                border: "none", background: "none",
                color: activeTab === "weekly" ? "#fff" : "var(--color-text-muted)",
                fontSize: 14, fontWeight: 600,
                padding: "10px 0",
                borderBottom: `2px solid ${activeTab === "weekly" ? "var(--color-accent)" : "transparent"}`,
                cursor: "pointer",
              }}
            >
              Weekly Analytics
            </button>
          )}

          <button
            onClick={() => switchTab("leave")}
            style={{
              border: "none", background: "none",
              color: activeTab === "leave" ? "#fff" : "var(--color-text-muted)",
              fontSize: 14, fontWeight: 600,
              padding: "10px 0",
              borderBottom: `2px solid ${activeTab === "leave" ? "var(--color-accent)" : "transparent"}`,
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            Leave Requests
            {pendingLeaveRequests.length > 0 && (
              <span style={{
                background: "var(--color-warning, #FFB703)", color: "#000",
                borderRadius: "50%", width: 18, height: 18,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 800,
              }}>
                {pendingLeaveRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => switchTab("my")}
            style={{
              border: "none", background: "none",
              color: activeTab === "my" ? "#fff" : "var(--color-text-muted)",
              fontSize: 14, fontWeight: 600,
              padding: "10px 0",
              borderBottom: `2px solid ${activeTab === "my" ? "var(--color-accent)" : "transparent"}`,
              cursor: "pointer",
            }}
          >
            My Clock-In & History
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY ATTENDANCE (Firm Wide + Personal Clock-in)                   */}
      {/* ========================================================================= */}
      {activeTab === "daily" && isPrivileged && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Top 5 Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>Present today</div>
              <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, marginTop: 8, color: "var(--color-text-primary)" }}>
                {presentCount + lateCount}<span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>/{totalStaffCount}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 }}>Checked in</div>
            </div>

            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 11, color: "#FFB703", textTransform: "uppercase", letterSpacing: ".07em" }}>Late</div>
              <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, marginTop: 8, color: "#FFB703" }}>
                {lateCount}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 }}>After {firmOfficeStartTime}</div>
            </div>

            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>On leave</div>
              <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, marginTop: 8, color: "var(--color-text-primary)" }}>
                {onLeaveCount}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 }}>Approved leave</div>
            </div>

            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 11, color: "#E63946", textTransform: "uppercase", letterSpacing: ".07em" }}>Absent</div>
              <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, marginTop: 8, color: "#E63946" }}>
                {absentCount}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 }}>No check-in</div>
            </div>

            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 11, color: "#FFB703", textTransform: "uppercase", letterSpacing: ".07em" }}>Pending requests</div>
              <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, marginTop: 8, color: "#FFB703" }}>
                {pendingLeaveRequests.length}
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 }}>Need approval</div>
            </div>
          </div>

          {/* Main Grid: Left Table (1.6fr), Right Clock-In Widget (1fr) */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, alignItems: "start" }}>
            {/* Left: Today's Attendance Table Card */}
            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", gap: 12, borderBottom: "1px solid var(--color-border)" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>Today's attendance</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Check-in and check-out per staff member</div>
                </div>

                {/* Filter Pills */}
                <div style={{ display: "flex", gap: 6 }}>
                  {(["all", "late", "on_leave", "absent"] as const).map((filterKey) => (
                    <button
                      key={filterKey}
                      onClick={() => setAttendanceFilter(filterKey)}
                      style={{
                        padding: "5px 10px",
                        fontSize: 12, fontWeight: 600,
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        background: attendanceFilter === filterKey ? "var(--color-bg-canvas)" : "transparent",
                        color: attendanceFilter === filterKey ? "var(--color-text-primary)" : "var(--color-text-muted)",
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {filterKey.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div style={{ padding: "10px 18px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                  <input
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    placeholder="Search staff by name or role..."
                    style={{
                      width: "100%", paddingLeft: 32, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
                      background: "transparent", border: "none", color: "var(--color-text-primary)", fontSize: 13, outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                      <th style={{ padding: "10px 16px", fontWeight: 600 }}>Staff member</th>
                      <th style={{ padding: "10px 12px", fontWeight: 600 }}>In-time</th>
                      <th style={{ padding: "10px 12px", fontWeight: 600 }}>Out-time</th>
                      <th style={{ padding: "10px 12px", fontWeight: 600 }}>Total hours</th>
                      <th style={{ padding: "10px 16px", fontWeight: 600, textAlign: "right" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendanceStaff.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "var(--color-text-muted)" }}>
                          No staff records found for this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAttendanceStaff.map((staff: any) => {
                        const isWorkingNow = staff.session?.status === "working";
                        return (
                          <tr
                            key={staff.id}
                            style={{ borderBottom: "1px solid var(--color-border)", cursor: "pointer" }}
                            onClick={() => router.push(`/${params.firmSlug}/staff/${staff.id}`)}
                          >
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: "50%",
                                  background: staff.avatarColor || "#E85D04",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontWeight: 700, fontSize: 12, color: "#fff", flexShrink: 0,
                                }}>
                                  {staff.avatarInitials || staff.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{staff.name}</div>
                                  <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{staff.designation || staff.role}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "12px 12px", color: staff.derivedStatus === "late" ? "#FFB703" : "var(--color-text-primary)" }}>
                              {staff.inTime}
                            </td>
                            <td style={{ padding: "12px 12px", color: "var(--color-text-secondary)" }}>
                              {staff.outTime}
                            </td>
                            <td style={{ padding: "12px 12px", color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                              {isWorkingNow && staff.session?.checkInTime ? (
                                <span style={{ color: "#06D6A0", fontWeight: 700 }}>
                                  <LiveTimer startTime={staff.session.checkInTime} />
                                </span>
                              ) : (
                                staff.hoursWorked
                              )}
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              <span style={{
                                display: "inline-block", padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                                background:
                                  staff.derivedStatus === "present" ? "rgba(6,214,160,0.15)"
                                  : staff.derivedStatus === "late" ? "rgba(255,183,3,0.15)"
                                  : staff.derivedStatus === "on_leave" ? "rgba(165,140,240,0.15)"
                                  : "rgba(230,57,70,0.15)",
                                color:
                                  staff.derivedStatus === "present" ? "#06D6A0"
                                  : staff.derivedStatus === "late" ? "#FFB703"
                                  : staff.derivedStatus === "on_leave" ? "#A58CF0"
                                  : "#E63946",
                                textTransform: "capitalize",
                              }}>
                                {staff.derivedStatus.replace("_", " ")}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Personal Clock-In Widget */}
            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>
                Your Timekeeping
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 16 }}>
                Clock in, switch active task, or manage your personal session
              </div>

              {!session || session.status === "checked_out" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 4 }}>
                      Select Project
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        setSelectedTaskId("");
                      }}
                      style={{ width: "100%", padding: "8px 12px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13 }}
                    >
                      <option value="">— Select project —</option>
                      {projects.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 4 }}>
                      Select Task
                    </label>
                    <select
                      value={selectedTaskId}
                      onChange={(e) => setSelectedTaskId(e.target.value)}
                      disabled={!selectedProjectId}
                      style={{ width: "100%", padding: "8px 12px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13, opacity: selectedProjectId ? 1 : 0.5 }}
                    >
                      <option value="">— Select task —</option>
                      {selectedProjectId && tasksForProject(selectedProjectId).map((t: any) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleCheckIn}
                    disabled={submittingAtt || !selectedProjectId || !selectedTaskId}
                    style={{
                      marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "10px", background: "var(--color-accent)", color: "#fff",
                      border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: 13,
                      cursor: submittingAtt || !selectedProjectId || !selectedTaskId ? "not-allowed" : "pointer",
                      opacity: submittingAtt || !selectedProjectId || !selectedTaskId ? 0.6 : 1,
                    }}
                  >
                    <LogIn size={15} /> {submittingAtt ? "Checking in..." : "Check In & Start Working"}
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Status Banner */}
                  <div style={{
                    padding: 14, borderRadius: "var(--radius-md)",
                    background: session.status === "working" ? "rgba(6,214,160,0.12)" : "rgba(255,183,3,0.12)",
                    border: `1px solid ${session.status === "working" ? "rgba(6,214,160,0.3)" : "rgba(255,183,3,0.3)"}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: session.status === "working" ? "#06D6A0" : "#FFB703", textTransform: "uppercase" }}>
                        {session.status === "working" ? "Working Now" : "On Break"}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: session.status === "working" ? "#06D6A0" : "#FFB703" }}>
                        {session.status === "working" && session.checkInTime && <LiveTimer startTime={session.checkInTime} />}
                      </span>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {tasks.find((t: any) => t.id === session.currentTaskId)?.title || session.currentTaskId || "Task"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                        {projects.find((p: any) => p.id === session.currentProjectId)?.name || "Project"}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {session.status === "working" ? (
                      <button
                        onClick={handleTakeBreak}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        <Coffee size={14} color="#FFB703" /> Take Break
                      </button>
                    ) : (
                      <button
                        onClick={handleResumeWork}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        <Play size={14} /> Resume Work
                      </button>
                    )}

                    <button
                      onClick={() => setSwitching((v) => !v)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      <ArrowRightLeft size={14} /> Switch Task
                    </button>

                    <button
                      onClick={handleCheckOut}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", background: "rgba(230,57,70,0.15)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius-sm)", color: "#E63946", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      <LogOut size={14} /> Check Out
                    </button>
                  </div>

                  {/* Task Switch Dropdown Form */}
                  {switching && (
                    <div style={{ padding: 12, background: "var(--color-bg-subtle)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 8 }}>
                      <select
                        value={switchProjectId}
                        onChange={(e) => {
                          setSwitchProjectId(e.target.value);
                          setSwitchTaskId("");
                        }}
                        style={{ width: "100%", padding: "6px 10px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 12 }}
                      >
                        <option value="">— Select new project —</option>
                        {projects.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>

                      <select
                        value={switchTaskId}
                        onChange={(e) => setSwitchTaskId(e.target.value)}
                        disabled={!switchProjectId}
                        style={{ width: "100%", padding: "6px 10px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 12, opacity: switchProjectId ? 1 : 0.5 }}
                      >
                        <option value="">— Select new task —</option>
                        {switchProjectId && tasksForProject(switchProjectId).map((t: any) => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>

                      <button
                        onClick={handleSwitchTask}
                        disabled={submittingAtt || !switchProjectId || !switchTaskId}
                        style={{ padding: "6px 10px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        {submittingAtt ? "Switching..." : "Confirm Switch"}
                      </button>
                    </div>
                  )}

                  {/* Breakdown bars */}
                  {taskBreakdown.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
                        Time per task today
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {taskBreakdown.map((b: any) => {
                          const t = tasks.find((item: any) => item.id === b.taskId);
                          const total = taskBreakdown.reduce((sum: number, x: any) => sum + x.totalMinutes, 0) || 1;
                          const pct = Math.round((b.totalMinutes / total) * 100);
                          return (
                            <div key={b.taskId}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{t?.title || b.taskId}</span>
                                <span style={{ color: "var(--color-text-secondary)" }}>{formatMinutes(b.totalMinutes)}</span>
                              </div>
                              <div style={{ height: 4, background: "var(--color-bg-canvas)", borderRadius: 2, overflow: "hidden", marginTop: 2 }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: "var(--color-accent)", borderRadius: 2 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WEEKLY ANALYTICS                                                   */}
      {/* ========================================================================= */}
      {activeTab === "weekly" && isPrivileged && (
        <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>
            Weekly Attendance Matrix
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 20 }}>
            Monday through Friday presence for active firm staff
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>Staff member</th>
                  <th style={{ padding: "10px 12px", fontWeight: 600, textAlign: "center" }}>Mon</th>
                  <th style={{ padding: "10px 12px", fontWeight: 600, textAlign: "center" }}>Tue</th>
                  <th style={{ padding: "10px 12px", fontWeight: 600, textAlign: "center" }}>Wed</th>
                  <th style={{ padding: "10px 12px", fontWeight: 600, textAlign: "center" }}>Thu</th>
                  <th style={{ padding: "10px 12px", fontWeight: 600, textAlign: "center" }}>Fri</th>
                  <th style={{ padding: "10px 14px", fontWeight: 600, textAlign: "right" }}>Weekly Hours</th>
                </tr>
              </thead>
              <tbody>
                {weeklyData.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--color-text-muted)" }}>
                      No weekly records found for this period.
                    </td>
                  </tr>
                ) : (
                  weeklyData.map((w: any) => (
                    <tr key={w.userId} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{w.userName}</div>
                        <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{w.role}</div>
                      </td>
                      {(w.days || []).map((day: any, i: number) => {
                        const bg =
                          day.status === "present" ? "rgba(6,214,160,0.15)"
                          : day.status === "late" ? "rgba(255,183,3,0.15)"
                          : day.status === "on_leave" ? "rgba(165,140,240,0.15)"
                          : "rgba(255,255,255,0.04)";
                        const fg =
                          day.status === "present" ? "#06D6A0"
                          : day.status === "late" ? "#FFB703"
                          : day.status === "on_leave" ? "#A58CF0"
                          : "var(--color-text-muted)";
                        return (
                          <td key={i} style={{ padding: "12px 12px", textAlign: "center" }}>
                            <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: bg, color: fg }}>
                              {day.status === "present" ? `${day.hours}h` : day.status === "late" ? `Late ${day.hours}h` : day.status === "on_leave" ? "Leave" : "—"}
                            </span>
                          </td>
                        );
                      })}
                      <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {w.totalHours || 0} hrs
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LEAVE MANAGEMENT                                                   */}
      {/* ========================================================================= */}
      {activeTab === "leave" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Pending Leave Approvals for Leads / Admin */}
          {isPrivileged && (
            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>
                    Pending Leave Requests ({pendingLeaveRequests.length})
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                    Requests requiring management review and clash resolution
                  </div>
                </div>
              </div>

              {pendingLeaveRequests.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--color-text-muted)" }}>
                  No pending leave requests at this time.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {pendingLeaveRequests.map((req: any) => (
                    <div
                      key={req.id}
                      onClick={() => setSelectedLeaveId(req.id)}
                      style={{
                        padding: 16, borderRadius: "var(--radius-md)",
                        background: activeSelectedLeave?.id === req.id ? "var(--color-bg-subtle)" : "var(--color-bg-canvas)",
                        border: `1px solid ${activeSelectedLeave?.id === req.id ? "var(--color-accent)" : "var(--color-border)"}`,
                        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
                        cursor: "pointer",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: 14 }}>
                            {req.user?.name || "Staff Member"}
                          </span>
                          <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: "rgba(165,140,240,0.15)", color: "#A58CF0", textTransform: "capitalize" }}>
                            {req.type}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                            {req.days} day{req.days !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
                          {format(parseISO(req.startDate), "MMM d, yyyy")} → {format(parseISO(req.endDate), "MMM d, yyyy")}
                          {req.reason && ` · "${req.reason}"`}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleApproveLeave(req.id)}
                          style={{ padding: "6px 14px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setShowRejectModal({ id: req.id, name: req.user?.name || "Staff" })}
                          style={{ padding: "6px 14px", background: "transparent", color: "#E63946", border: "1px solid rgba(230,57,70,0.4)", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Clash Analysis Strip for Selected Leave */}
              {activeSelectedLeave && clashStripDays.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 8 }}>
                    Task Deadline Clash Strip: {activeSelectedLeave.user?.name}
                  </div>
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                    {clashStripDays.map((cd: any) => (
                      <div
                        key={cd.dateStr}
                        style={{
                          padding: "8px 12px", borderRadius: "var(--radius-sm)",
                          background: cd.hasSubmissionClash ? "rgba(230,57,70,0.15)" : "var(--color-bg-canvas)",
                          border: `1px solid ${cd.hasSubmissionClash ? "#E63946" : "var(--color-border)"}`,
                          minWidth: 70, textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{cd.weekday}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: cd.hasSubmissionClash ? "#E63946" : "var(--color-text-primary)" }}>{cd.dayNum}</div>
                        {cd.hasSubmissionClash && (
                          <div style={{ fontSize: 9, color: "#E63946", fontWeight: 700, marginTop: 2 }}>
                            {cd.clashes.length} clash{cd.clashes.length !== 1 ? "es" : ""}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Leave History Table */}
          <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>Leave History</div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Records of past and upcoming leave requests</div>
              </div>

              {/* Status Filters */}
              <div style={{ display: "flex", gap: 6 }}>
                {(["pending", "approved", "rejected", "all"] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    onClick={() => setLeaveFilter(filterKey)}
                    style={{
                      padding: "5px 12px", fontSize: 12, fontWeight: 600,
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      background: leaveFilter === filterKey ? "var(--color-bg-canvas)" : "transparent",
                      color: leaveFilter === filterKey ? "var(--color-text-primary)" : "var(--color-text-muted)",
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {filterKey}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                    <th style={{ padding: "10px 14px", fontWeight: 600 }}>Staff member</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600 }}>Type</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600 }}>Period</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600 }}>Days</th>
                    <th style={{ padding: "10px 12px", fontWeight: 600 }}>Reason</th>
                    <th style={{ padding: "10px 14px", fontWeight: 600, textAlign: "right" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 28, textAlign: "center", color: "var(--color-text-muted)" }}>
                        No leave records found matching this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLeaves.map((lr: any) => (
                      <tr key={lr.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                          {lr.user?.name || "Staff Member"}
                        </td>
                        <td style={{ padding: "12px 12px", textTransform: "capitalize", color: "var(--color-text-secondary)" }}>
                          {lr.type}
                        </td>
                        <td style={{ padding: "12px 12px", color: "var(--color-text-secondary)" }}>
                          {format(parseISO(lr.startDate), "MMM d")} → {format(parseISO(lr.endDate), "MMM d, yyyy")}
                        </td>
                        <td style={{ padding: "12px 12px", fontVariantNumeric: "tabular-nums" }}>
                          {lr.days}
                        </td>
                        <td style={{ padding: "12px 12px", color: "var(--color-text-muted)", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {lr.reason || "—"}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          <span style={{
                            display: "inline-block", padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                            background:
                              lr.status === "approved" ? "rgba(6,214,160,0.15)"
                              : lr.status === "pending" ? "rgba(255,183,3,0.15)"
                              : "rgba(230,57,70,0.15)",
                            color:
                              lr.status === "approved" ? "#06D6A0"
                              : lr.status === "pending" ? "#FFB703"
                              : "#E63946",
                            textTransform: "capitalize",
                          }}>
                            {lr.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MY CLOCK-IN & HISTORY                                              */}
      {/* ========================================================================= */}
      {activeTab === "my" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Main Clock-In Action Card */}
          <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>
              Active Work Session
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 18 }}>
              Track your working time against assigned project tasks
            </div>

            {!session || session.status === "checked_out" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end", maxWidth: 700 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 4 }}>
                    Select Project
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                      setSelectedTaskId("");
                    }}
                    style={{ width: "100%", padding: "9px 12px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13 }}
                  >
                    <option value="">— Select project —</option>
                    {projects.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 4 }}>
                    Select Task
                  </label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    disabled={!selectedProjectId}
                    style={{ width: "100%", padding: "9px 12px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13, opacity: selectedProjectId ? 1 : 0.5 }}
                  >
                    <option value="">— Select task —</option>
                    {selectedProjectId && tasksForProject(selectedProjectId).map((t: any) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCheckIn}
                  disabled={submittingAtt || !selectedProjectId || !selectedTaskId}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "9px 18px", background: "var(--color-accent)", color: "#fff",
                    border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: 13,
                    cursor: submittingAtt || !selectedProjectId || !selectedTaskId ? "not-allowed" : "pointer",
                    opacity: submittingAtt || !selectedProjectId || !selectedTaskId ? 0.6 : 1,
                  }}
                >
                  <LogIn size={15} /> Check In
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{
                  padding: 18, borderRadius: "var(--radius-md)",
                  background: session.status === "working" ? "rgba(6,214,160,0.12)" : "rgba(255,183,3,0.12)",
                  border: `1px solid ${session.status === "working" ? "rgba(6,214,160,0.3)" : "rgba(255,183,3,0.3)"}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
                }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: session.status === "working" ? "#06D6A0" : "#FFB703", textTransform: "uppercase" }}>
                      {session.status === "working" ? "● Working Session Active" : "● On Break"}
                    </span>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)", marginTop: 6 }}>
                      {tasks.find((t: any) => t.id === session.currentTaskId)?.title || session.currentTaskId || "Current Task"}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                      {projects.find((p: any) => p.id === session.currentProjectId)?.name || "Project"}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Elapsed Time</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: session.status === "working" ? "#06D6A0" : "#FFB703" }}>
                      {session.status === "working" && session.checkInTime ? <LiveTimer startTime={session.checkInTime} /> : "Paused"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {session.status === "working" ? (
                    <button
                      onClick={handleTakeBreak}
                      style={{ padding: "8px 16px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Coffee size={14} color="#FFB703" /> Take Break
                    </button>
                  ) : (
                    <button
                      onClick={handleResumeWork}
                      style={{ padding: "8px 16px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Play size={14} /> Resume Work
                    </button>
                  )}

                  <button
                    onClick={() => setSwitching((v) => !v)}
                    style={{ padding: "8px 16px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <ArrowRightLeft size={14} /> Switch Task
                  </button>

                  <button
                    onClick={handleCheckOut}
                    style={{ padding: "8px 16px", background: "rgba(230,57,70,0.15)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: "var(--radius-sm)", color: "#E63946", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <LogOut size={14} /> Check Out
                  </button>
                </div>

                {/* Switch task dropdown form */}
                {switching && (
                  <div style={{ padding: 14, background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 4 }}>New Project</label>
                      <select
                        value={switchProjectId}
                        onChange={(e) => {
                          setSwitchProjectId(e.target.value);
                          setSwitchTaskId("");
                        }}
                        style={{ width: "100%", padding: "7px 10px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13 }}
                      >
                        <option value="">— Select new project —</option>
                        {projects.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 4 }}>New Task</label>
                      <select
                        value={switchTaskId}
                        onChange={(e) => setSwitchTaskId(e.target.value)}
                        disabled={!switchProjectId}
                        style={{ width: "100%", padding: "7px 10px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontSize: 13, opacity: switchProjectId ? 1 : 0.5 }}
                      >
                        <option value="">— Select new task —</option>
                        {switchProjectId && tasksForProject(switchProjectId).map((t: any) => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleSwitchTask}
                      disabled={submittingAtt || !switchProjectId || !switchTaskId}
                      style={{ padding: "8px 16px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                    >
                      {submittingAtt ? "Switching..." : "Switch"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Personal History */}
          <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>
              Your Recent Attendance History
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 16 }}>
              Past check-in records and hours logged
            </div>

            {history.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--color-text-muted)" }}>
                No past attendance records found.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {history.map((h: any) => (
                  <div
                    key={h.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 0", borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: 13 }}>
                        {format(parseISO(h.date), "EEEE, MMMM d, yyyy")}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                        {format(new Date(h.checkInTime), "hh:mm a")}
                        {h.checkOutTime && ` → ${format(new Date(h.checkOutTime), "hh:mm a")}`}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ fontSize: 13, color: "var(--color-text-primary)" }}>
                        Work: <strong>{formatMinutes(h.totalWorkMinutes || 0)}</strong>
                      </span>
                      {h.totalBreakMinutes > 0 && (
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                          Break: {formatMinutes(h.totalBreakMinutes)}
                        </span>
                      )}
                      <span style={{
                        padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                        background: h.status === "checked_out" ? "rgba(255,255,255,0.06)" : "rgba(6,214,160,0.15)",
                        color: h.status === "checked_out" ? "var(--color-text-muted)" : "#06D6A0",
                        textTransform: "capitalize",
                      }}>
                        {h.status === "checked_out" ? "Completed" : "Active"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE LEAVE REQUEST MODAL ── */}
      {showCreateLeaveModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setShowCreateLeaveModal(false)} />
          <div style={{ position: "relative", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 28, width: 420, zIndex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700 }}>Request Leave</h2>
              <button onClick={() => setShowCreateLeaveModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateLeaveSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: 4, color: "var(--color-text-secondary)" }}>Leave Type *</label>
                <select
                  value={createLeaveForm.type}
                  onChange={(e) => setCreateLeaveForm((f) => ({ ...f, type: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)" }}
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="casual">Casual Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: 4, color: "var(--color-text-secondary)" }}>Start Date *</label>
                  <input
                    type="date"
                    required
                    value={createLeaveForm.startDate}
                    onChange={(e) => setCreateLeaveForm((f) => ({ ...f, startDate: e.target.value }))}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: 4, color: "var(--color-text-secondary)" }}>End Date *</label>
                  <input
                    type="date"
                    required
                    value={createLeaveForm.endDate}
                    onChange={(e) => setCreateLeaveForm((f) => ({ ...f, endDate: e.target.value }))}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, marginBottom: 4, color: "var(--color-text-secondary)" }}>Reason (Optional)</label>
                <textarea
                  value={createLeaveForm.reason}
                  onChange={(e) => setCreateLeaveForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="e.g. Family vacation or medical appointment"
                  rows={3}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)", fontSize: "var(--text-sm)", boxSizing: "border-box" }}
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                style={{
                  marginTop: 6, padding: "10px",
                  background: "var(--color-accent)", color: "#fff",
                  border: "none", borderRadius: "var(--radius-md)",
                  fontWeight: 700, fontSize: "var(--text-sm)",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                {actionLoading ? "Submitting..." : "Submit Leave Request"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── REJECT LEAVE MODAL ── */}
      {showRejectModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setShowRejectModal(null)} />
          <div style={{ position: "relative", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 24, width: 380, zIndex: 1 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>Reject Leave Request</h3>
            <p style={{ margin: "0 0 14px", color: "var(--color-text-secondary)", fontSize: 13 }}>
              Please provide a reason for rejecting the request from <strong>{showRejectModal.name}</strong>.
            </p>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Critical project milestone submission scheduled"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)", fontSize: 13, boxSizing: "border-box", marginBottom: 14 }}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowRejectModal(null)}
                style={{ padding: "8px 14px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: "pointer", color: "var(--color-text-primary)", fontWeight: 600, fontSize: 12 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                style={{ padding: "8px 16px", background: "#E63946", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 700, fontSize: 12 }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
