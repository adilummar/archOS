"use client";
/**
 * Meetings Page — firm-wide meetings list.
 * Two tabs: Upcoming | Past
 * Inline add form, click-to-expand cards, reschedule & delete with confirm.
 */

import { useState, useEffect, useMemo } from "react";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import {
  CalendarDays,
  Search,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Link2,
  Users,
  Pencil,
  Trash2,
  UserCheck,
  Video,
  Phone,
  HardHat,
} from "lucide-react";
import { useMeetingStore } from "@/lib/store/meeting.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { toast } from "@/lib/store/toast.store";
import { Avatar, AvatarGroup } from "@/components/shared/Avatar";
import type { Meeting, MeetingMode } from "@/lib/store/types";

// ─── Constants ───────────────────────────────────────────────────────────────

const MODE_LABELS: Record<MeetingMode, string> = {
  in_person: "In Person",
  phone: "Phone",
  google_meet: "Google Meet",
  teams: "Teams",
  site_visit: "Site Visit",
};

const MODE_COLORS: Record<MeetingMode, { color: string; bg: string }> = {
  in_person: { color: "var(--color-success)", bg: "var(--color-success-muted)" },
  phone: { color: "var(--color-text-muted)", bg: "rgb(107 107 112 / 0.12)" },
  google_meet: { color: "var(--color-info)", bg: "var(--color-info-muted)" },
  teams: { color: "var(--color-accent)", bg: "var(--color-accent-muted)" },
  site_visit: { color: "var(--color-warning)", bg: "var(--color-warning-muted)" },
};

const MODE_ICON: Record<MeetingMode, React.ReactNode> = {
  in_person: <Users size={11} />,
  phone: <Phone size={11} />,
  google_meet: <Video size={11} />,
  teams: <Video size={11} />,
  site_visit: <HardHat size={11} />,
};

const LOCATION_LABEL: Record<MeetingMode, string> = {
  in_person: "Location / Address",
  phone: "Phone Number",
  google_meet: "Meeting Link",
  teams: "Meeting Link",
  site_visit: "Site Address",
};

const today = () => new Date().toISOString().slice(0, 10);

// ─── Blank form state ─────────────────────────────────────────────────────────

interface AddFormState {
  title: string;
  projectId: string;
  date: string;
  time: string;
  durationMinutes: number;
  mode: MeetingMode;
  locationOrLink: string;
  attendeeIds: string[];
  clientAttending: boolean;
  remarks: string;
}

const blankForm = (): AddFormState => ({
  title: "",
  projectId: "",
  date: today(),
  time: "10:00",
  durationMinutes: 60,
  mode: "in_person",
  locationOrLink: "",
  attendeeIds: [],
  clientAttending: false,
  remarks: "",
});

interface RescheduleFormState {
  date: string;
  time: string;
  durationMinutes: number;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MeetingsPage() {
  const { meetings, add, reschedule, delete: deleteMeeting } = useMeetingStore();
  const { user, firm } = useAuthStore();
  const { projects } = useProjectStore();
  const { users } = useFirmStore();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddFormState>(blankForm());
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState<RescheduleFormState>({
    date: today(),
    time: "10:00",
    durationMinutes: 60,
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 1.2 s skeleton loader
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  // ─── Derived data ───────────────────────────────────────────────────────────

  const firmProjects = useMemo(
    () => projects.filter((p) => p.firmId === firm?.id),
    [projects, firm]
  );

  const firmUsers = useMemo(
    () => users.filter((u) => u.firmId === firm?.id && u.status === "active"),
    [users, firm]
  );

  const todayStr = today();

  const filteredMeetings = useMemo(() => {
    if (!firm) return [];
    const q = search.trim().toLowerCase();
    return meetings
      .filter((m) => {
        if (m.firmId !== firm.id) return false;
        const isUpcoming = m.date >= todayStr;
        if (activeTab === "upcoming" && !isUpcoming) return false;
        if (activeTab === "past" && isUpcoming) return false;
        if (q) {
          const project = projects.find((p) => p.id === m.projectId);
          return (
            m.title.toLowerCase().includes(q) ||
            (project?.name.toLowerCase().includes(q) ?? false)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const cmp = a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
        return activeTab === "upcoming" ? cmp : -cmp;
      });
  }, [meetings, firm, activeTab, search, todayStr, projects]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getProject = (id: string) => projects.find((p) => p.id === id);
  const getUser = (id: string) => users.find((u) => u.id === id);

  const formatDateLabel = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      if (isToday(d)) return `Today · ${format(d, "d MMM yyyy")}`;
      if (isTomorrow(d)) return `Tomorrow · ${format(d, "d MMM yyyy")}`;
      return format(d, "EEE, d MMM yyyy");
    } catch {
      return dateStr;
    }
  };

  // ─── Add meeting ─────────────────────────────────────────────────────────────

  const handleAdd = () => {
    if (!firm || !user) return;
    if (!addForm.title.trim()) {
      toast("Please enter a meeting title", "error");
      return;
    }
    if (!addForm.projectId) {
      toast("Please select a project", "error");
      return;
    }
    if (!addForm.date) {
      toast("Please select a date", "error");
      return;
    }
    setAddSubmitting(true);
    add({
      firmId: firm.id,
      projectId: addForm.projectId,
      title: addForm.title.trim(),
      date: addForm.date,
      time: addForm.time,
      durationMinutes: addForm.durationMinutes,
      mode: addForm.mode,
      location: addForm.mode === "in_person" || addForm.mode === "site_visit"
        ? addForm.locationOrLink
        : undefined,
      meetingLink: addForm.mode === "google_meet" || addForm.mode === "teams"
        ? addForm.locationOrLink
        : undefined,
      attendeeIds: addForm.attendeeIds,
      clientAttending: addForm.clientAttending,
      contractorIds: [],
      remarks: addForm.remarks.trim() || undefined,
      createdById: user.id,
    });
    toast("Meeting scheduled", "success");
    setAddForm(blankForm());
    setShowAddForm(false);
    setAddSubmitting(false);
  };

  // ─── Reschedule ──────────────────────────────────────────────────────────────

  const openReschedule = (m: Meeting) => {
    setRescheduleId(m.id);
    setRescheduleForm({ date: m.date, time: m.time, durationMinutes: m.durationMinutes });
    setExpandedId(m.id);
    setDeleteConfirmId(null);
  };

  const handleReschedule = () => {
    if (!user || !rescheduleId) return;
    reschedule(rescheduleId, {
      date: rescheduleForm.date,
      time: rescheduleForm.time,
      durationMinutes: rescheduleForm.durationMinutes,
      rescheduledById: user.id,
    });
    toast("Meeting rescheduled", "success");
    setRescheduleId(null);
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = (id: string) => {
    deleteMeeting(id);
    toast("Meeting deleted", "default");
    setDeleteConfirmId(null);
    setExpandedId(null);
    setRescheduleId(null);
  };

  // ─── Styles ──────────────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    background: "var(--color-bg-input)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--color-text-primary)",
    fontSize: "var(--text-sm)",
    padding: "8px 12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "var(--text-xs)",
    fontWeight: 500,
    color: "var(--color-text-muted)",
    marginBottom: 4,
    display: "block",
  };

  // ─── Loading skeleton ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Title skeleton */}
        <div
          style={{
            width: 160,
            height: 32,
            background: "var(--color-bg-card)",
            borderRadius: "var(--radius-md)",
          }}
        />
        {/* Tab bar skeleton */}
        <div style={{ display: "flex", gap: 8 }}>
          {[90, 70].map((w, i) => (
            <div
              key={i}
              style={{
                width: w,
                height: 36,
                background: "var(--color-bg-card)",
                borderRadius: "var(--radius-sm)",
              }}
            />
          ))}
        </div>
        {/* Card skeletons */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 110,
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
            }}
          />
        ))}
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        background: "var(--color-bg-canvas)",
        minHeight: "100%",
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "var(--text-xl)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}
        >
          Meetings
        </h1>
        <button
          onClick={() => {
            setShowAddForm((v) => !v);
            if (!showAddForm) setAddForm(blankForm());
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            background: showAddForm ? "var(--color-bg-card)" : "var(--color-accent)",
            color: showAddForm ? "var(--color-text-secondary)" : "#fff",
            border: showAddForm ? "1px solid var(--color-border)" : "none",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            cursor: "pointer",
            transition: "opacity var(--duration-fast)",
          }}
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          {showAddForm ? "Cancel" : "Add Meeting"}
        </button>
      </div>

      {/* ── Inline Add Form ── */}
      {showAddForm && (
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            Schedule New Meeting
          </p>

          {/* Row 1: Title + Project */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Title *</label>
              <input
                style={inputStyle}
                placeholder="e.g. Design Review"
                value={addForm.title}
                onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>
            <div>
              <label style={labelStyle}>Project *</label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={addForm.projectId}
                onChange={(e) => setAddForm((f) => ({ ...f, projectId: e.target.value }))}
              >
                <option value="">Select project…</option>
                {firmProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Date + Time + Duration */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Date *</label>
              <input
                type="date"
                style={inputStyle}
                value={addForm.date}
                onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>
            <div>
              <label style={labelStyle}>Time</label>
              <input
                type="time"
                style={inputStyle}
                value={addForm.time}
                onChange={(e) => setAddForm((f) => ({ ...f, time: e.target.value }))}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>
            <div>
              <label style={labelStyle}>Duration (min)</label>
              <input
                type="number"
                min={5}
                step={5}
                style={inputStyle}
                value={addForm.durationMinutes}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))
                }
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>
          </div>

          {/* Row 3: Mode + Location/Link */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Mode</label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={addForm.mode}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, mode: e.target.value as MeetingMode }))
                }
              >
                {(Object.entries(MODE_LABELS) as [MeetingMode, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{LOCATION_LABEL[addForm.mode]}</label>
              <input
                style={inputStyle}
                placeholder={
                  addForm.mode === "google_meet" || addForm.mode === "teams"
                    ? "https://…"
                    : "Enter address…"
                }
                value={addForm.locationOrLink}
                onChange={(e) => setAddForm((f) => ({ ...f, locationOrLink: e.target.value }))}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>
          </div>

          {/* Row 4: Attendees */}
          <div>
            <label style={labelStyle}>Attendees</label>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                padding: 10,
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {firmUsers.map((u) => {
                const checked = addForm.attendeeIds.includes(u.id);
                return (
                  <label
                    key={u.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: "var(--radius-sm)",
                      background: checked
                        ? "var(--color-accent-muted)"
                        : "var(--color-bg-card)",
                      border: `1px solid ${checked ? "var(--color-accent)" : "var(--color-border)"}`,
                      cursor: "pointer",
                      fontSize: "var(--text-xs)",
                      color: checked
                        ? "var(--color-accent)"
                        : "var(--color-text-secondary)",
                      fontWeight: checked ? 500 : 400,
                      transition: "all var(--duration-fast)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      style={{ display: "none" }}
                      onChange={(e) => {
                        setAddForm((f) => ({
                          ...f,
                          attendeeIds: e.target.checked
                            ? [...f.attendeeIds, u.id]
                            : f.attendeeIds.filter((id) => id !== u.id),
                        }));
                      }}
                    />
                    <Avatar name={u.name} size="sm" color={u.avatarColor} tooltip={false} />
                    {u.name}
                  </label>
                );
              })}
              {firmUsers.length === 0 && (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  No staff members found
                </span>
              )}
            </div>
          </div>

          {/* Row 5: Client attending + Remarks */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "start" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: addForm.clientAttending
                  ? "var(--color-accent-muted)"
                  : "var(--color-bg-input)",
                border: `1px solid ${addForm.clientAttending ? "var(--color-accent)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                fontSize: "var(--text-sm)",
                color: addForm.clientAttending ? "var(--color-accent)" : "var(--color-text-secondary)",
                fontWeight: addForm.clientAttending ? 500 : 400,
                whiteSpace: "nowrap",
                transition: "all var(--duration-fast)",
              }}
            >
              <input
                type="checkbox"
                checked={addForm.clientAttending}
                style={{ display: "none" }}
                onChange={(e) => setAddForm((f) => ({ ...f, clientAttending: e.target.checked }))}
              />
              <UserCheck size={14} />
              Client attending
            </label>
            <div>
              <label style={labelStyle}>Remarks</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
                placeholder="Agenda, notes, or instructions…"
                value={addForm.remarks}
                onChange={(e) => setAddForm((f) => ({ ...f, remarks: e.target.value }))}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              onClick={() => {
                setShowAddForm(false);
                setAddForm(blankForm());
              }}
              style={{
                padding: "8px 16px",
                background: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text-secondary)",
                fontSize: "var(--text-sm)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={addSubmitting}
              style={{
                padding: "8px 20px",
                background: "var(--color-accent)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                cursor: addSubmitting ? "not-allowed" : "pointer",
                opacity: addSubmitting ? 0.7 : 1,
              }}
            >
              Schedule Meeting
            </button>
          </div>
        </div>
      )}

      {/* ── Tabs + Search row ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Tab buttons */}
        <div
          style={{
            display: "flex",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
          }}
        >
          {(["upcoming", "past"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 18px",
                background:
                  activeTab === tab ? "var(--color-accent)" : "transparent",
                color:
                  activeTab === tab ? "#fff" : "var(--color-text-secondary)",
                border: "none",
                fontSize: "var(--text-sm)",
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: "pointer",
                transition: "all var(--duration-fast)",
                textTransform: "capitalize",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search by title or project…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "var(--color-bg-input)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-text-primary)",
              fontSize: "var(--text-sm)",
              padding: "8px 12px 8px 32px",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          />
        </div>

        {/* Count badge */}
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "4px 10px",
            marginLeft: "auto",
          }}
        >
          {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Meeting list ── */}
      {filteredMeetings.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredMeetings.map((m) => {
            const project = getProject(m.projectId);
            const modeStyle = MODE_COLORS[m.mode] ?? MODE_COLORS.in_person;
            const attendeeNames = m.attendeeIds
              .map((id) => getUser(id)?.name ?? "Unknown")
              .filter(Boolean);
            const isExpanded = expandedId === m.id;
            const isRescheduling = rescheduleId === m.id;
            const isDeleting = deleteConfirmId === m.id;
            const isUpcoming = m.date >= todayStr;

            return (
              <div
                key={m.id}
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  transition: "border-color var(--duration-fast)",
                  borderLeft: isToday(parseISO(m.date))
                    ? "3px solid var(--color-accent)"
                    : "3px solid transparent",
                }}
              >
                {/* ── Card header (always visible) ── */}
                <div
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedId(null);
                      setRescheduleId(null);
                      setDeleteConfirmId(null);
                    } else {
                      setExpandedId(m.id);
                      setRescheduleId(null);
                      setDeleteConfirmId(null);
                    }
                  }}
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--color-bg-card-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {/* Date block */}
                  <div
                    style={{
                      flexShrink: 0,
                      width: 52,
                      textAlign: "center",
                      background: "var(--color-bg-canvas)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "4px 0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {format(parseISO(m.date), "MMM")}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--text-lg)",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                        lineHeight: 1.2,
                      }}
                    >
                      {format(parseISO(m.date), "d")}
                    </div>
                  </div>

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "var(--text-sm)",
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {m.title}
                      </span>
                      {/* Mode badge */}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 7px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: 11,
                          fontWeight: 500,
                          color: modeStyle.color,
                          background: modeStyle.bg,
                        }}
                      >
                        {MODE_ICON[m.mode]}
                        {MODE_LABELS[m.mode]}
                      </span>
                      {m.clientAttending && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "2px 7px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: 11,
                            fontWeight: 500,
                            color: "var(--color-success)",
                            background: "var(--color-success-muted)",
                          }}
                        >
                          <UserCheck size={10} />
                          Client
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Project */}
                      {project && (
                        <span
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {project.name}
                        </span>
                      )}
                      {/* Time */}
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        <Clock size={11} />
                        {m.time} · {m.durationMinutes} min
                      </span>
                      {/* Remarks snippet */}
                      {m.remarks && !isExpanded && (
                        <span
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--color-text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 200,
                          }}
                        >
                          {m.remarks}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attendees */}
                  {attendeeNames.length > 0 && (
                    <div style={{ flexShrink: 0 }}>
                      <AvatarGroup names={attendeeNames} size="sm" max={4} />
                    </div>
                  )}

                  {/* Chevron */}
                  <div style={{ flexShrink: 0, color: "var(--color-text-muted)" }}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* ── Expanded details ── */}
                {isExpanded && (
                  <div
                    style={{
                      borderTop: "1px solid var(--color-border)",
                      padding: "16px 16px 16px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    {/* Detail grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: 12,
                      }}
                    >
                      <DetailRow icon={<CalendarDays size={13} />} label="Date">
                        {formatDateLabel(m.date)}
                      </DetailRow>
                      <DetailRow icon={<Clock size={13} />} label="Time &amp; Duration">
                        {m.time} · {m.durationMinutes} min
                      </DetailRow>
                      {(m.location || m.meetingLink) && (
                        <DetailRow
                          icon={
                            m.meetingLink ? <Link2 size={13} /> : <MapPin size={13} />
                          }
                          label={m.meetingLink ? "Meeting Link" : "Location"}
                        >
                          {m.meetingLink ? (
                            <a
                              href={m.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "var(--color-accent)",
                                textDecoration: "none",
                                fontSize: "var(--text-xs)",
                              }}
                            >
                              {m.meetingLink}
                            </a>
                          ) : (
                            m.location
                          )}
                        </DetailRow>
                      )}
                    </div>

                    {/* Attendees full list */}
                    {m.attendeeIds.length > 0 && (
                      <div>
                        <p
                          style={{
                            margin: "0 0 8px",
                            fontSize: "var(--text-xs)",
                            fontWeight: 500,
                            color: "var(--color-text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Attendees
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {m.attendeeIds.map((id) => {
                            const u = getUser(id);
                            if (!u) return null;
                            return (
                              <div
                                key={id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "3px 10px 3px 4px",
                                  background: "var(--color-bg-canvas)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: "var(--radius-sm)",
                                  fontSize: "var(--text-xs)",
                                  color: "var(--color-text-secondary)",
                                }}
                              >
                                <Avatar
                                  name={u.name}
                                  size="sm"
                                  color={u.avatarColor}
                                  tooltip={false}
                                />
                                {u.name}
                              </div>
                            );
                          })}
                          {m.clientAttending && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "3px 10px",
                                background: "var(--color-success-muted)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "var(--text-xs)",
                                color: "var(--color-success)",
                                fontWeight: 500,
                              }}
                            >
                              <UserCheck size={11} />
                              Client attending
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Remarks */}
                    {m.remarks && (
                      <div>
                        <p
                          style={{
                            margin: "0 0 4px",
                            fontSize: "var(--text-xs)",
                            fontWeight: 500,
                            color: "var(--color-text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Remarks
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "var(--text-sm)",
                            color: "var(--color-text-secondary)",
                            lineHeight: 1.6,
                          }}
                        >
                          {m.remarks}
                        </p>
                      </div>
                    )}

                    {/* ── Reschedule inline form ── */}
                    {isRescheduling && (
                      <div
                        style={{
                          background: "var(--color-bg-canvas)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-sm)",
                          padding: 14,
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: "var(--text-xs)",
                            fontWeight: 600,
                            color: "var(--color-text-primary)",
                          }}
                        >
                          Reschedule Meeting
                        </p>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 10,
                          }}
                        >
                          <div>
                            <label style={labelStyle}>Date</label>
                            <input
                              type="date"
                              style={inputStyle}
                              value={rescheduleForm.date}
                              onChange={(e) =>
                                setRescheduleForm((f) => ({
                                  ...f,
                                  date: e.target.value,
                                }))
                              }
                              onFocus={(e) =>
                                (e.currentTarget.style.borderColor = "var(--color-accent)")
                              }
                              onBlur={(e) =>
                                (e.currentTarget.style.borderColor = "var(--color-border)")
                              }
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Time</label>
                            <input
                              type="time"
                              style={inputStyle}
                              value={rescheduleForm.time}
                              onChange={(e) =>
                                setRescheduleForm((f) => ({
                                  ...f,
                                  time: e.target.value,
                                }))
                              }
                              onFocus={(e) =>
                                (e.currentTarget.style.borderColor = "var(--color-accent)")
                              }
                              onBlur={(e) =>
                                (e.currentTarget.style.borderColor = "var(--color-border)")
                              }
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Duration (min)</label>
                            <input
                              type="number"
                              min={5}
                              step={5}
                              style={inputStyle}
                              value={rescheduleForm.durationMinutes}
                              onChange={(e) =>
                                setRescheduleForm((f) => ({
                                  ...f,
                                  durationMinutes: Number(e.target.value),
                                }))
                              }
                              onFocus={(e) =>
                                (e.currentTarget.style.borderColor = "var(--color-accent)")
                              }
                              onBlur={(e) =>
                                (e.currentTarget.style.borderColor = "var(--color-border)")
                              }
                            />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button
                            onClick={() => setRescheduleId(null)}
                            style={{
                              padding: "6px 14px",
                              background: "transparent",
                              border: "1px solid var(--color-border)",
                              borderRadius: "var(--radius-sm)",
                              color: "var(--color-text-secondary)",
                              fontSize: "var(--text-xs)",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleReschedule}
                            style={{
                              padding: "6px 16px",
                              background: "var(--color-accent)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "var(--text-xs)",
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                          >
                            Confirm Reschedule
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Delete confirm ── */}
                    {isDeleting && (
                      <div
                        style={{
                          background: "var(--color-destructive-muted)",
                          border: "1px solid var(--color-destructive)",
                          borderRadius: "var(--radius-sm)",
                          padding: "12px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "var(--text-xs)",
                            color: "var(--color-destructive)",
                            fontWeight: 500,
                          }}
                        >
                          Delete this meeting? This cannot be undone.
                        </span>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            style={{
                              padding: "5px 12px",
                              background: "transparent",
                              border: "1px solid var(--color-border)",
                              borderRadius: "var(--radius-sm)",
                              color: "var(--color-text-secondary)",
                              fontSize: "var(--text-xs)",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            style={{
                              padding: "5px 14px",
                              background: "var(--color-destructive)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "var(--text-xs)",
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Action buttons ── */}
                    {!isRescheduling && !isDeleting && (
                      <div style={{ display: "flex", gap: 8 }}>
                        {isUpcoming && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openReschedule(m);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "6px 14px",
                              background: "var(--color-bg-canvas)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "var(--radius-sm)",
                              color: "var(--color-text-secondary)",
                              fontSize: "var(--text-xs)",
                              cursor: "pointer",
                              fontWeight: 500,
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.borderColor = "var(--color-accent)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.borderColor = "var(--color-border)")
                            }
                          >
                            <Pencil size={11} />
                            Reschedule
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(m.id);
                            setRescheduleId(null);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 14px",
                            background: "var(--color-bg-canvas)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--color-destructive)",
                            fontSize: "var(--text-xs)",
                            cursor: "pointer",
                            fontWeight: 500,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.borderColor = "var(--color-destructive)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.borderColor = "var(--color-border)")
                          }
                        >
                          <Trash2 size={11} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 3,
          color: "var(--color-text-muted)",
        }}
      >
        {icon}
        <span
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
          dangerouslySetInnerHTML={{ __html: label }}
        />
      </div>
      <div
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-secondary)",
          lineHeight: 1.5,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: "upcoming" | "past" }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "72px 0",
        gap: 12,
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        color: "var(--color-text-muted)",
      }}
    >
      <CalendarDays size={44} strokeWidth={1} opacity={0.35} />
      <p
        style={{
          margin: 0,
          fontWeight: 500,
          color: "var(--color-text-secondary)",
          fontSize: "var(--text-sm)",
        }}
      >
        {tab === "upcoming"
          ? "No upcoming meetings — schedule one above"
          : "No past meetings yet"}
      </p>
      {tab === "upcoming" && (
        <p style={{ margin: 0, fontSize: "var(--text-xs)" }}>
          Click "Add Meeting" to schedule your first one.
        </p>
      )}
    </div>
  );
}
