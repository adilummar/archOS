"use client";
/**
 * CRM Page — Kanban board of sales leads.
 * 6 columns: New | Contacted | Proposal Sent | Negotiation | Won | Lost
 * Click card → right-side detail panel (380px).
 * Add Lead (admin/team_lead only) → inline slide-down form.
 */

import { useState, useEffect, useMemo } from "react";
import { format, isPast, parseISO } from "date-fns";
import {
  Users,
  Plus,
  X,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  Building2,
  StickyNote,
  Send,
  FolderKanban,
  CalendarClock,
} from "lucide-react";
import { useCrmStore } from "@/lib/store/crm.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { toast } from "@/lib/store/toast.store";
import { Avatar } from "@/components/shared/Avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Lead, LeadStage, LeadSource } from "@/lib/store/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES: { key: LeadStage; label: string }[] = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "proposal_sent", label: "Proposal Sent" },
  { key: "negotiation", label: "Negotiation" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

const SOURCE_LABELS: Record<LeadSource, string> = {
  referral: "Referral",
  walk_in: "Walk-in",
  social_media: "Social",
  website: "Website",
  cold_call: "Cold Call",
  other: "Other",
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ height, width = "100%" }: { height: number; width?: string | number }) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: "var(--radius-sm)",
        background: "var(--color-bg-card)",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-bg-card-hover) 50%, transparent 100%)",
          animation: "shimmer 1.5s infinite",
        }}
      />
    </div>
  );
}

function CrmSkeleton() {
  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SkeletonBlock height={32} width={120} />
        <SkeletonBlock height={36} width={130} />
      </div>
      <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
        {STAGES.map((s) => (
          <div
            key={s.key}
            style={{
              flexShrink: 0,
              width: 280,
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <SkeletonBlock height={20} width={100} />
            {[1, 2, 3].map((i) => (
              <SkeletonBlock key={i} height={120} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Source Badge ─────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: LeadSource }) {
  const sourceColors: Record<LeadSource, { color: string; bg: string }> = {
    referral: { color: "var(--color-success)", bg: "var(--color-success-muted)" },
    walk_in: { color: "var(--color-accent)", bg: "var(--color-accent-muted)" },
    social_media: { color: "var(--color-info)", bg: "var(--color-info-muted)" },
    website: { color: "var(--color-info)", bg: "var(--color-info-muted)" },
    cold_call: { color: "var(--color-warning)", bg: "var(--color-warning-muted)" },
    other: { color: "var(--color-text-muted)", bg: "rgb(107 107 112 / 0.12)" },
  };
  const cfg = sourceColors[source];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        padding: "2px 6px",
        borderRadius: "var(--radius-sm)",
        color: cfg.color,
        background: cfg.bg,
        whiteSpace: "nowrap",
      }}
    >
      {SOURCE_LABELS[source]}
    </span>
  );
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  isSelected: boolean;
}

function LeadCard({ lead, onClick, isSelected }: LeadCardProps) {
  const { users } = useFirmStore();
  const assignee = lead.assignedToId ? users.find((u) => u.id === lead.assignedToId) : null;
  const isOverdue = lead.followUpDate ? isPast(parseISO(lead.followUpDate)) : false;
  const isLost = lead.stage === "lost";
  const isWon = lead.stage === "won";

  const valueLakh =
    lead.estimatedValue != null ? (lead.estimatedValue / 100000).toFixed(1) : null;

  return (
    <div
      onClick={onClick}
      style={{
        background: isWon
          ? "color-mix(in srgb, var(--color-success) 10%, var(--color-bg-card))"
          : "var(--color-bg-card)",
        border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-md)",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        cursor: "pointer",
        opacity: isLost ? 0.6 : 1,
        transition: "border-color var(--duration-fast), box-shadow var(--duration-fast)",
        boxShadow: isSelected ? "0 0 0 2px var(--color-accent-muted)" : "none",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = "var(--color-accent-muted)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = "var(--color-border)";
      }}
    >
      {/* Name + Company */}
      <div>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            lineHeight: 1.3,
          }}
        >
          {lead.name}
        </p>
        {lead.company && (
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            {lead.company}
          </p>
        )}
      </div>

      {/* Project type + value */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {lead.projectType}
        </span>
        {valueLakh && (
          <span
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-mono)",
              flexShrink: 0,
            }}
          >
            ₹{valueLakh}L
          </span>
        )}
      </div>

      {/* Source + follow-up */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <SourceBadge source={lead.source} />
        {lead.followUpDate && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontSize: 10,
              fontWeight: 500,
              padding: "2px 6px",
              borderRadius: "var(--radius-sm)",
              color: isOverdue ? "var(--color-warning)" : "var(--color-text-muted)",
              background: isOverdue ? "var(--color-warning-muted)" : "rgb(107 107 112 / 0.10)",
              border: isOverdue ? "1px solid var(--color-warning)" : "1px solid transparent",
            }}
          >
            <CalendarClock size={10} strokeWidth={2} />
            {format(parseISO(lead.followUpDate), "d MMM")}
            {isOverdue && " · Overdue"}
          </span>
        )}
      </div>

      {/* Assignee */}
      {assignee && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Avatar name={assignee.name} color={assignee.avatarColor} size="sm" />
          <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>{assignee.name}</span>
        </div>
      )}
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  stage: { key: LeadStage; label: string };
  leads: Lead[];
  selectedId: string | null;
  onSelectLead: (id: string) => void;
}

function KanbanColumn({ stage, leads, selectedId, onSelectLead }: KanbanColumnProps) {
  const count = leads.length;

  const COLUMN_ACCENT: Partial<Record<LeadStage, string>> = {
    won: "var(--color-success)",
    lost: "var(--color-destructive)",
    new: "var(--color-text-muted)",
    contacted: "var(--color-info)",
    proposal_sent: "var(--color-warning)",
    negotiation: "var(--color-accent)",
  };
  const accent = COLUMN_ACCENT[stage.key] ?? "var(--color-text-muted)";

  return (
    <div
      style={{
        flexShrink: 0,
        width: 280,
        display: "flex",
        flexDirection: "column",
        gap: 0,
        background: "var(--color-bg-sidebar)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--color-bg-card)",
          borderTop: `3px solid ${accent}`,
        }}
      >
        <span
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            flex: 1,
          }}
        >
          {stage.label}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--color-text-muted)",
            background: "var(--color-bg-input)",
            padding: "1px 7px",
            borderRadius: 10,
            minWidth: 20,
            textAlign: "center",
          }}
        >
          {count}
        </span>
      </div>

      {/* Cards */}
      <div
        style={{
          flex: 1,
          padding: 10,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflowY: "auto",
          minHeight: 200,
        }}
      >
        {leads.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "28px 12px",
              gap: 6,
              color: "var(--color-text-muted)",
            }}
          >
            <Users size={28} strokeWidth={1} opacity={0.4} />
            <span style={{ fontSize: "var(--text-xs)", textAlign: "center" }}>
              No {stage.label.toLowerCase()} leads
            </span>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              isSelected={selectedId === lead.id}
              onClick={() => onSelectLead(lead.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Add Lead Form ────────────────────────────────────────────────────────────

interface AddLeadFormProps {
  firmId: string;
  users: import("@/lib/store/types").User[];
  onClose: () => void;
}

function AddLeadForm({ firmId, users, onClose }: AddLeadFormProps) {
  const { addLead } = useCrmStore();

  const [form, setForm] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    projectType: "",
    estimatedValue: "",
    location: "",
    source: "referral" as LeadSource,
    assignedToId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const activeUsers = users.filter((u) => u.firmId === firmId && u.status === "active");

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.projectType.trim()) {
      toast("Please fill in all required fields", "error");
      return;
    }
    setSubmitting(true);
    addLead({
      firmId,
      name: form.name.trim(),
      company: form.company.trim() || undefined,
      phone: form.phone.trim(),
      email: form.email.trim(),
      projectType: form.projectType.trim(),
      estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) * 100000 : undefined,
      location: form.location.trim() || undefined,
      source: form.source,
      assignedToId: form.assignedToId || undefined,
    });
    toast(`Lead "${form.name.trim()}" added`, "success");
    setSubmitting(false);
    onClose();
  };

  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: 20,
        marginBottom: 8,
        animation: "slideDown 0.2s ease-out",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-primary)" }}>
          New Lead
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            padding: 4,
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Name <span style={{ color: "var(--color-destructive)" }}>*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Lead name"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          {/* Company */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Company
            </label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Company name"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          {/* Phone */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Phone <span style={{ color: "var(--color-destructive)" }}>*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 98765 43210"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Email <span style={{ color: "var(--color-destructive)" }}>*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="lead@example.com"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          {/* Project type */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Project Type <span style={{ color: "var(--color-destructive)" }}>*</span>
            </label>
            <input
              type="text"
              value={form.projectType}
              onChange={(e) => set("projectType", e.target.value)}
              placeholder="e.g. Residential villa"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          {/* Estimated value */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Est. Value (₹ Lakh)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.estimatedValue}
              onChange={(e) => set("estimatedValue", e.target.value)}
              placeholder="e.g. 25"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          {/* Location */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="City / area"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          {/* Source */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Source
            </label>
            <select
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {(Object.keys(SOURCE_LABELS) as LeadSource[]).map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned to */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: "span 2" }}>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Assigned To
            </label>
            <select
              value={form.assignedToId}
              onChange={(e) => set("assignedToId", e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="">Unassigned</option>
              {activeUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.designation})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-text-secondary)",
              fontSize: "var(--text-sm)",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--color-accent)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-text-inverse)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              padding: "8px 18px",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            <Plus size={14} />
            Add Lead
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Lead Detail Panel ────────────────────────────────────────────────────────

interface LeadDetailPanelProps {
  lead: Lead;
  onClose: () => void;
  firmUsers: import("@/lib/store/types").User[];
  currentUserId: string;
  isAdmin: boolean;
}

function LeadDetailPanel({ lead, onClose, firmUsers, currentUserId, isAdmin }: LeadDetailPanelProps) {
  const { updateLead, setStage, addNote } = useCrmStore();

  const [noteText, setNoteText] = useState("");
  const [lostReasonInput, setLostReasonInput] = useState(lead.lostReason ?? "");
  const [stageDraft, setStageDraft] = useState<LeadStage>(lead.stage);
  const [addingNote, setAddingNote] = useState(false);
  const [followUpDraft, setFollowUpDraft] = useState(lead.followUpDate ?? "");
  const [assignedToDraft, setAssignedToDraft] = useState(lead.assignedToId ?? "");

  const activeUsers = firmUsers.filter((u) => u.firmId === lead.firmId && u.status === "active");
  const assignee = lead.assignedToId ? firmUsers.find((u) => u.id === lead.assignedToId) : null;

  const inputStyle: React.CSSProperties = {
    background: "var(--color-bg-input)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--color-text-primary)",
    fontSize: "var(--text-sm)",
    padding: "7px 10px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "var(--text-xs)",
    color: "var(--color-text-muted)",
    fontWeight: 500,
    marginBottom: 4,
  };

  const handleStageChange = (newStage: LeadStage) => {
    setStageDraft(newStage);
    if (newStage === "lost") return; // wait for lost reason
    setStage(lead.id, newStage);
    toast(`Stage updated to ${newStage.replace(/_/g, " ")}`, "success");
  };

  const handleSaveLostReason = () => {
    setStage(lead.id, "lost", { lostReason: lostReasonInput });
    toast("Lead marked as lost", "default");
  };

  const handleUpdateFollowUp = () => {
    updateLead(lead.id, { followUpDate: followUpDraft || undefined });
    toast("Follow-up date updated", "success");
  };

  const handleUpdateAssignee = (id: string) => {
    setAssignedToDraft(id);
    updateLead(lead.id, { assignedToId: id || undefined });
    toast("Assignee updated", "success");
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    addNote(lead.id, { content: noteText.trim(), createdById: currentUserId });
    toast("Note added", "success");
    setNoteText("");
    setAddingNote(false);
  };

  const handleConvertToProject = () => {
    toast("Project creation flow coming soon — mark the project manually for now.", "default");
  };

  return (
    <div
      style={{
        width: 380,
        flexShrink: 0,
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        alignSelf: "flex-start",
        maxHeight: "calc(100vh - 100px)",
        position: "sticky",
        top: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-base)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {lead.name}
          </p>
          {lead.company && (
            <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              {lead.company}
            </p>
          )}
        </div>
        <StatusBadge status={lead.stage} size="sm" />
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            padding: 4,
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable body */}
      <div
        style={{
          overflowY: "auto",
          flex: 1,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Contact info */}
        <div
          style={{
            background: "var(--color-bg-sidebar)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 7,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Phone size={12} color="var(--color-text-muted)" />
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{lead.phone}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Mail size={12} color="var(--color-text-muted)" />
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{lead.email}</span>
          </div>
          {lead.location && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MapPin size={12} color="var(--color-text-muted)" />
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{lead.location}</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={12} color="var(--color-text-muted)" />
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              {lead.projectType}
              {lead.estimatedValue != null && (
                <span style={{ color: "var(--color-text-muted)", marginLeft: 6 }}>
                  · ₹{(lead.estimatedValue / 100000).toFixed(1)}L
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Stage */}
        <div>
          <p style={labelStyle}>Stage</p>
          <select
            value={stageDraft}
            onChange={(e) => handleStageChange(e.target.value as LeadStage)}
            style={{ ...inputStyle, cursor: "pointer" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          >
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Lost reason — shown when stage = lost */}
        {stageDraft === "lost" && (
          <div>
            <p style={labelStyle}>Lost Reason</p>
            <textarea
              value={lostReasonInput}
              onChange={(e) => setLostReasonInput(e.target.value)}
              placeholder="Why was this lead lost?"
              rows={2}
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "inherit",
                lineHeight: 1.5,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
            <button
              onClick={handleSaveLostReason}
              style={{
                marginTop: 6,
                background: "var(--color-destructive)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text-inverse)",
                fontSize: "var(--text-xs)",
                fontWeight: 500,
                padding: "6px 14px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Mark as Lost
            </button>
          </div>
        )}

        {/* Assigned to */}
        <div>
          <p style={labelStyle}>Assigned To</p>
          <select
            value={assignedToDraft}
            onChange={(e) => handleUpdateAssignee(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          >
            <option value="">Unassigned</option>
            {activeUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Follow-up date */}
        <div>
          <p style={labelStyle}>Follow-up Date</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="date"
              value={followUpDraft}
              onChange={(e) => setFollowUpDraft(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
            <button
              onClick={handleUpdateFollowUp}
              style={{
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text-secondary)",
                fontSize: "var(--text-xs)",
                padding: "7px 10px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Save
            </button>
          </div>
        </div>

        {/* Convert to Project (won + admin only) */}
        {lead.stage === "won" && isAdmin && (
          <button
            onClick={handleConvertToProject}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: "var(--color-success-muted)",
              border: "1px solid var(--color-success)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-success)",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              padding: "10px 16px",
              cursor: "pointer",
              transition: "all var(--duration-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-success)";
              e.currentTarget.style.color = "var(--color-text-inverse)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-success-muted)";
              e.currentTarget.style.color = "var(--color-success)";
            }}
          >
            <FolderKanban size={15} />
            Convert to Project
          </button>
        )}

        {/* Divider */}
        <div style={{ borderTop: "1px solid var(--color-border)" }} />

        {/* Notes history */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <StickyNote size={14} color="var(--color-text-muted)" />
            <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
              Notes
            </p>
            <span
              style={{
                fontSize: 10,
                background: "var(--color-bg-input)",
                color: "var(--color-text-muted)",
                padding: "1px 6px",
                borderRadius: 10,
              }}
            >
              {lead.notes.length}
            </span>
          </div>

          {lead.notes.length === 0 ? (
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-muted)",
                textAlign: "center",
                padding: "12px 0",
              }}
            >
              No notes yet — add the first one below.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...lead.notes].reverse().map((note) => {
                const author = firmUsers.find((u) => u.id === note.createdById);
                return (
                  <div
                    key={note.id}
                    style={{
                      background: "var(--color-bg-sidebar)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "10px 12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      {author && (
                        <Avatar name={author.name} color={author.avatarColor} size="sm" />
                      )}
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-secondary)" }}>
                        {author?.name ?? "Staff"}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--color-text-muted)", marginLeft: "auto" }}>
                        {format(parseISO(note.createdAt), "d MMM, HH:mm")}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {note.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add note */}
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note…"
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "inherit",
                lineHeight: 1.5,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAddNote();
              }}
            />
            <button
              onClick={handleAddNote}
              disabled={!noteText.trim() || addingNote}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: noteText.trim() ? "var(--color-accent)" : "var(--color-bg-input)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                color: noteText.trim() ? "var(--color-text-inverse)" : "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                padding: "8px 14px",
                cursor: noteText.trim() ? "pointer" : "not-allowed",
                opacity: addingNote ? 0.7 : 1,
                transition: "all var(--duration-fast)",
              }}
            >
              <Send size={13} />
              Add Note
            </button>
          </div>
        </div>

        {/* Meta */}
        <div
          style={{
            paddingTop: 8,
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-muted)" }}>
            Source: <strong>{SOURCE_LABELS[lead.source]}</strong>
          </p>
          <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-muted)" }}>
            Created: {format(parseISO(lead.createdAt), "d MMM yyyy")}
          </p>
          <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-muted)" }}>
            Updated: {format(parseISO(lead.updatedAt), "d MMM yyyy, HH:mm")}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── CRM Page ─────────────────────────────────────────────────────────────────

export default function CrmPage() {
  const { leads } = useCrmStore();
  const { user, firm } = useAuthStore();
  const { users } = useFirmStore();

  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const canAddLead = user?.role === "admin" || user?.role === "team_lead";
  const isAdmin = user?.role === "admin";

  const firmLeads = useMemo(
    () => leads.filter((l) => l.firmId === firm?.id),
    [leads, firm]
  );

  const leadsByStage = useMemo(() => {
    const map: Record<LeadStage, Lead[]> = {
      new: [],
      contacted: [],
      proposal_sent: [],
      negotiation: [],
      won: [],
      lost: [],
    };
    firmLeads.forEach((l) => {
      map[l.stage].push(l);
    });
    return map;
  }, [firmLeads]);

  const selectedLead = selectedLeadId ? firmLeads.find((l) => l.id === selectedLeadId) : null;

  const handleSelectLead = (id: string) => {
    setSelectedLeadId((prev) => (prev === id ? null : id));
  };

  if (loading) return <CrmSkeleton />;
  if (!user || !firm) return null;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          minHeight: "100%",
          background: "var(--color-bg-canvas)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "var(--text-xl)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
              }}
            >
              CRM
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              {firmLeads.length} total lead{firmLeads.length !== 1 ? "s" : ""}
            </p>
          </div>

          {canAddLead && (
            <button
              onClick={() => setShowAddForm((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: showAddForm ? "var(--color-bg-card)" : "var(--color-accent)",
                border: showAddForm ? "1px solid var(--color-border)" : "none",
                borderRadius: "var(--radius-sm)",
                color: showAddForm ? "var(--color-text-secondary)" : "var(--color-text-inverse)",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                padding: "9px 16px",
                cursor: "pointer",
                transition: "all var(--duration-fast)",
              }}
              onMouseEnter={(e) => {
                if (!showAddForm) e.currentTarget.style.background = "var(--color-accent-hover)";
              }}
              onMouseLeave={(e) => {
                if (!showAddForm) e.currentTarget.style.background = "var(--color-accent)";
              }}
            >
              {showAddForm ? <X size={14} /> : <Plus size={14} />}
              {showAddForm ? "Cancel" : "Add Lead"}
            </button>
          )}
        </div>

        {/* Add Lead inline form */}
        {showAddForm && (
          <AddLeadForm
            firmId={firm.id}
            users={users}
            onClose={() => setShowAddForm(false)}
          />
        )}

        {/* Kanban + Detail Panel */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flex: 1 }}>
          {/* Scrollable Kanban */}
          <div
            style={{
              display: "flex",
              gap: 16,
              overflowX: "auto",
              flex: 1,
              paddingBottom: 8,
              minHeight: 500,
            }}
          >
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage.key}
                stage={stage}
                leads={leadsByStage[stage.key]}
                selectedId={selectedLeadId}
                onSelectLead={handleSelectLead}
              />
            ))}
          </div>

          {/* Detail panel */}
          {selectedLead && (
            <LeadDetailPanel
              lead={selectedLead}
              onClose={() => setSelectedLeadId(null)}
              firmUsers={users}
              currentUserId={user.id}
              isAdmin={isAdmin}
            />
          )}
        </div>
      </div>
    </>
  );
}
