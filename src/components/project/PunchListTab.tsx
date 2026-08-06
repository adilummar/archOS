"use client";
/**
 * PunchListTab — project detail (4.12)
 * Open, resolved, confirmed items. Architect can confirm resolution.
 * Admin/team_lead can add new items.
 */

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ListChecks, Plus, Check, RotateCcw, X } from "lucide-react";
import { usePunchlistStore } from "../../lib/store/punchlist.store";
import { useAuthStore } from "../../lib/store/auth.store";
import { useFirmStore } from "../../lib/store/firm.store";
import { StatusBadge } from "../shared/StatusBadge";
import { toast } from "../../lib/store/toast.store";
import type { Project } from "../../lib/store/types";

function PunchListRow({
  item,
  userId,
  userRole,
}: {
  item: ReturnType<typeof usePunchlistStore.getState>["items"][number];
  userId: string;
  userRole: string;
}) {
  const { confirmByArchitect, reopen } = usePunchlistStore();
  const { users } = useFirmStore();
  const canConfirm = userRole === "admin" || userRole === "team_lead";

  const raisedBy = users.find((u) => u.id === item.raisedById)?.name ?? "Unknown";

  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderLeft: `3px solid ${
          item.status === "confirmed_by_architect"
            ? "var(--color-success)"
            : item.status === "resolved_by_contractor"
            ? "var(--color-warning)"
            : "var(--color-destructive)"
        }`,
        borderRadius: "var(--radius-md)",
        padding: "14px 18px",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}
    >
      {/* Item number */}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          color: "var(--color-text-muted)",
          paddingTop: 2,
          flexShrink: 0,
        }}
      >
        {item.itemNumber}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                lineHeight: 1.4,
              }}
            >
              {item.description}
            </p>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: "var(--text-xs)",
                color: "var(--color-text-muted)",
              }}
            >
              Location: {item.location} · Raised by {raisedBy} ·{" "}
              {format(parseISO(item.createdAt), "d MMM yyyy")}
            </p>
          </div>
          <StatusBadge status={item.status} size="sm" />
        </div>

        {item.contractorNote && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 12px",
              background: "var(--color-bg-input)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p
              style={{
                margin: "0 0 2px",
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                color: "var(--color-text-muted)",
              }}
            >
              Contractor resolution note
              {item.contractorResolvedAt &&
                ` · ${format(parseISO(item.contractorResolvedAt), "d MMM yyyy")}`}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "var(--text-sm)",
                color: "var(--color-text-secondary)",
              }}
            >
              {item.contractorNote}
            </p>
          </div>
        )}

        {/* Actions */}
        {canConfirm && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {item.status === "resolved_by_contractor" && (
              <button
                onClick={() => {
                  confirmByArchitect(item.id, userId);
                  toast(`${item.itemNumber} confirmed as resolved`, "success");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "transparent",
                  border: "1px solid var(--color-success)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-success)",
                  fontSize: "var(--text-xs)",
                  padding: "5px 12px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                <Check size={12} />
                Confirm Resolved
              </button>
            )}
            {item.status === "resolved_by_contractor" && (
              <button
                onClick={() => {
                  reopen(item.id, userId);
                  toast(`${item.itemNumber} reopened`, "default");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-text-muted)",
                  fontSize: "var(--text-xs)",
                  padding: "5px 12px",
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={12} />
                Reopen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AddItemForm({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const { addItem } = usePunchlistStore();
  const { user, firm } = useAuthStore();
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dueDate, setDueDate] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firm || !description || !location) return;
    addItem({
      firmId: firm.id,
      projectId: project.id,
      description: description.trim(),
      location: location.trim(),
      raisedById: user.id,
      dueDate: dueDate || undefined,
    });
    toast("Punch list item added", "success");
    onClose();
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
          Add Punch List Item
        </h3>
        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}
        >
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
            Issue Description *
          </label>
          <textarea
            style={{ ...inputStyle, resize: "vertical" }}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the punch list issue…"
            required
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
              Location / Area *
            </label>
            <input
              style={inputStyle}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Ground floor lobby"
              required
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>
          <div>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
              Due Date
            </label>
            <input
              type="date"
              style={inputStyle}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              padding: "7px 16px",
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
              padding: "7px 18px",
              cursor: "pointer",
            }}
          >
            Add Item
          </button>
        </div>
      </form>
    </div>
  );
}

export function PunchListTab({ project }: { project: Project }) {
  const { items } = usePunchlistStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "resolved_by_contractor" | "confirmed_by_architect">("all");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const projectItems = items.filter((i) => i.projectId === project.id);
  const filtered = projectItems.filter((i) =>
    filterStatus === "all" ? true : i.status === filterStatus
  );

  const canManage = user?.role === "admin" || user?.role === "team_lead";

  const counts = {
    all: projectItems.length,
    open: projectItems.filter((i) => i.status === "open").length,
    resolved_by_contractor: projectItems.filter((i) => i.status === "resolved_by_contractor").length,
    confirmed_by_architect: projectItems.filter((i) => i.status === "confirmed_by_architect").length,
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{ height: 80, background: "var(--color-bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 16, borderBottom: "1px solid var(--color-border)" }}>
          {([
            { key: "all", label: "All" },
            { key: "open", label: "Open" },
            { key: "resolved_by_contractor", label: "Resolved" },
            { key: "confirmed_by_architect", label: "Confirmed" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: filterStatus === key ? "2px solid var(--color-accent)" : "2px solid transparent",
                color: filterStatus === key ? "var(--color-text-primary)" : "var(--color-text-muted)",
                padding: "6px 0",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: -1,
              }}
            >
              {label}
              <span
                style={{
                  background: filterStatus === key ? "var(--color-accent-muted)" : "var(--color-bg-subtle)",
                  color: filterStatus === key ? "var(--color-accent)" : "var(--color-text-muted)",
                  padding: "1px 6px",
                  borderRadius: 10,
                  fontSize: 10,
                }}
              >
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
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
            <Plus size={14} />
            Add Item
          </button>
        )}
      </div>

      {showForm && (
        <AddItemForm project={project} onClose={() => setShowForm(false)} />
      )}

      {filtered.length === 0 && !showForm ? (
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
          <ListChecks size={40} strokeWidth={1} opacity={0.4} />
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text-secondary)" }}>
              {filterStatus === "all" ? "No punch list items" : `No ${filterStatus.replace(/_/g, " ")} items`}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)" }}>
              Punch list items track site defects that contractors must resolve before handover.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((item) => (
            <PunchListRow
              key={item.id}
              item={item}
              userId={user?.id ?? ""}
              userRole={user?.role ?? "staff"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
