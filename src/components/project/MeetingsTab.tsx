"use client";
/**
 * Meetings Tab — project detail (4.10)
 * Upcoming / past split, add meeting form slide-in, reschedule.
 */

import { useState, useEffect } from "react";
import { format, parseISO, isPast } from "date-fns";
import {
  Calendar,
  Plus,
  Video,
  Phone,
  MapPin,
  Users,
  ExternalLink,
  Clock,
  X,
} from "lucide-react";
import { useMeetingStore } from "../../lib/store/meeting.store";
import { useAuthStore } from "../../lib/store/auth.store";
import { useFirmStore } from "../../lib/store/firm.store";
import { toast } from "../../lib/store/toast.store";
import type { Project, MeetingMode } from "../../lib/store/types";

const MODE_ICON: Record<MeetingMode, React.ReactNode> = {
  in_person: <MapPin size={12} />,
  phone: <Phone size={12} />,
  google_meet: <Video size={12} />,
  teams: <Video size={12} />,
  site_visit: <MapPin size={12} />,
};

const MODE_LABEL: Record<MeetingMode, string> = {
  in_person: "In Person",
  phone: "Phone",
  google_meet: "Google Meet",
  teams: "Teams",
  site_visit: "Site Visit",
};

function MeetingCard({
  meeting,
  firmUsers,
  canManage,
}: {
  meeting: ReturnType<typeof useMeetingStore.getState>["meetings"][number];
  firmUsers: ReturnType<typeof useFirmStore.getState>["users"];
  canManage: boolean;
}) {
  const { delete: deleteMeeting } = useMeetingStore();
  const past = isPast(parseISO(`${meeting.date}T${meeting.time}`));
  const attendees = meeting.attendeeIds
    .map((id) => firmUsers.find((u) => u.id === id)?.name)
    .filter(Boolean);

  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: `1px solid ${past ? "var(--color-border)" : "var(--color-border)"}`,
        borderLeft: past ? "3px solid var(--color-border)" : "3px solid var(--color-accent)",
        borderRadius: "var(--radius-md)",
        padding: "14px 18px",
        display: "flex",
        gap: 16,
        opacity: past ? 0.7 : 1,
      }}
    >
      {/* Date block */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 52,
          padding: "8px",
          background: past ? "var(--color-bg-input)" : "var(--color-accent-muted)",
          borderRadius: "var(--radius-sm)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: past ? "var(--color-text-muted)" : "var(--color-accent)",
            fontFamily: "var(--font-display)",
            lineHeight: 1,
          }}
        >
          {format(parseISO(meeting.date), "d")}
        </span>
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: past ? "var(--color-text-muted)" : "var(--color-accent)",
            fontWeight: 500,
          }}
        >
          {format(parseISO(meeting.date), "MMM")}
        </span>
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {meeting.title}
          </h4>
          {canManage && !past && (
            <button
              onClick={() => {
                deleteMeeting(meeting.id);
                toast("Meeting cancelled", "default");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                padding: 4,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-destructive)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
              title="Cancel meeting"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 4,
            flexWrap: "wrap",
          }}
        >
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
            {meeting.time} · {meeting.durationMinutes}m
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            {MODE_ICON[meeting.mode]}
            {MODE_LABEL[meeting.mode]}
          </span>
          {meeting.clientAttending && (
            <span
              style={{
                fontSize: 10,
                background: "var(--color-accent-muted)",
                color: "var(--color-accent)",
                padding: "2px 8px",
                borderRadius: 10,
                fontWeight: 500,
              }}
            >
              Client Attending
            </span>
          )}
        </div>

        {attendees.length > 0 && (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            <Users size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
            {attendees.join(", ")}
          </p>
        )}

        {meeting.remarks && (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-secondary)",
              fontStyle: "italic",
            }}
          >
            {meeting.remarks}
          </p>
        )}

        {meeting.meetingLink && (
          <a
            href={meeting.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              marginTop: 6,
              fontSize: "var(--text-xs)",
              color: "var(--color-accent)",
              textDecoration: "none",
            }}
          >
            <ExternalLink size={11} />
            Join meeting
          </a>
        )}
      </div>
    </div>
  );
}

function AddMeetingForm({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const { add } = useMeetingStore();
  const { user, firm } = useAuthStore();
  const { users } = useFirmStore();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(60);
  const [mode, setMode] = useState<MeetingMode>("in_person");
  const [clientAttending, setClientAttending] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>(
    user ? [user.id] : []
  );

  const firmUsers = users.filter(
    (u) => u.firmId === firm?.id && u.status === "active"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firm || !title || !date) return;
    add({
      firmId: firm.id,
      projectId: project.id,
      title: title.trim(),
      date,
      time,
      durationMinutes: duration,
      mode,
      clientAttending,
      attendeeIds: selectedAttendees,
      contractorIds: [],
      remarks: remarks.trim() || undefined,
      meetingLink: meetingLink.trim() || undefined,
      createdById: user.id,
    });
    toast(`Meeting "${title}" scheduled`, "success");
    onClose();
  };

  const toggleAttendee = (id: string) => {
    setSelectedAttendees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--color-bg-input)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--color-text-primary)",
    fontSize: "var(--text-sm)",
    padding: "8px 12px",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}
        >
          Schedule Meeting
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-text-muted)",
            cursor: "pointer",
          }}
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
            Meeting Title *
          </label>
          <input
            style={inputStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Design Review with Client"
            required
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
              Date *
            </label>
            <input
              type="date"
              style={inputStyle}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>
          <div>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
              Time
            </label>
            <input
              type="time"
              style={inputStyle}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>
          <div>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
              Duration (min)
            </label>
            <select
              style={inputStyle}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            >
              {[30, 45, 60, 90, 120, 180].map((d) => (
                <option key={d} value={d}>{d} min</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
            Mode
          </label>
          <select
            style={inputStyle}
            value={mode}
            onChange={(e) => setMode(e.target.value as MeetingMode)}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          >
            {(Object.keys(MODE_LABEL) as MeetingMode[]).map((m) => (
              <option key={m} value={m}>{MODE_LABEL[m]}</option>
            ))}
          </select>
        </div>

        {(mode === "google_meet" || mode === "teams") && (
          <div>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
              Meeting Link
            </label>
            <input
              style={inputStyle}
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>
        )}

        <div>
          <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>
            Attendees
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {firmUsers.map((u) => {
              const selected = selectedAttendees.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleAttendee(u.id)}
                  style={{
                    background: selected ? "var(--color-accent-muted)" : "var(--color-bg-input)",
                    border: `1px solid ${selected ? "var(--color-accent)" : "var(--color-border)"}`,
                    borderRadius: "var(--radius-sm)",
                    color: selected ? "var(--color-accent)" : "var(--color-text-secondary)",
                    fontSize: "var(--text-xs)",
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontWeight: selected ? 500 : 400,
                  }}
                >
                  {u.name}
                </button>
              );
            })}
          </div>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "var(--text-sm)",
            color: "var(--color-text-secondary)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={clientAttending}
            onChange={(e) => setClientAttending(e.target.checked)}
            style={{ accentColor: "var(--color-accent)" }}
          />
          Client attending
        </label>

        <div>
          <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
            Notes / Remarks
          </label>
          <textarea
            style={{ ...inputStyle, resize: "vertical" }}
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional agenda or remarks…"
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              background: "var(--color-accent)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              color: "#fff",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              padding: "8px 20px",
              cursor: "pointer",
            }}
          >
            Schedule Meeting
          </button>
        </div>
      </form>
    </div>
  );
}

export function MeetingsTab({ project }: { project: Project }) {
  const { meetings } = useMeetingStore();
  const { user } = useAuthStore();
  const { users } = useFirmStore();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const projectMeetings = meetings
    .filter((m) => m.projectId === project.id)
    .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

  const upcoming = projectMeetings.filter(
    (m) => !isPast(parseISO(`${m.date}T${m.time}`))
  );
  const past = projectMeetings.filter((m) =>
    isPast(parseISO(`${m.date}T${m.time}`))
  );

  const canManage =
    user?.role === "admin" || user?.role === "team_lead";

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: 90,
              background: "var(--color-bg-card)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-primary)" }}>
          Meetings
        </h3>
        {canManage && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--color-accent)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              color: "#fff",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              padding: "7px 14px",
              cursor: "pointer",
            }}
          >
            <Plus size={15} />
            Schedule
          </button>
        )}
      </div>

      {showForm && (
        <AddMeetingForm project={project} onClose={() => setShowForm(false)} />
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Upcoming ({upcoming.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcoming.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                firmUsers={users}
                canManage={canManage}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Past ({past.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {past.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                firmUsers={users}
                canManage={false}
              />
            ))}
          </div>
        </div>
      )}

      {projectMeetings.length === 0 && !showForm && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 0",
            gap: 12,
            color: "var(--color-text-muted)",
          }}
        >
          <Calendar size={40} strokeWidth={1} opacity={0.4} />
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text-secondary)" }}>
              No meetings scheduled
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)" }}>
              Schedule a client review, site visit, or design meeting to track your engagements.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
