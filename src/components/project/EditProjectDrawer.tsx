"use client";
/**
 * EditProjectDrawer — slide-in form for editing an existing project.
 * Allows admin / team_lead to update name, client, location, dates,
 * fee values, fee structure, status, team lead, staff, and contractors.
 */

import { useMemo, useState, useEffect } from "react";
import { Drawer } from "../shared/Drawer";
import { toast } from "../../lib/store/toast.store";
import { nowIso } from "../../lib/store/uid";
import { useAuthStore } from "../../lib/store/auth.store";
import { useFirmStore } from "../../lib/store/firm.store";
import { useProjectStore } from "../../lib/store/project.store";
import { Avatar } from "../shared/Avatar";
import { X, Plus } from "lucide-react";
import type { Project } from "../../lib/store/types";

interface Props {
  open: boolean;
  project: Project | null;
  onClose: () => void;
}

const FEE_OPTIONS = [
  { value: "lump_sum", label: "Lump Sum" },
  { value: "percentage", label: "% of Value" },
  { value: "per_stage", label: "Per Stage" },
] as const;

const STATUS_OPTIONS: { value: Project["status"]; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function EditProjectDrawer({ open, project, onClose }: Props) {
  const { user, firm } = useAuthStore();
  const { users, clients, contractors } = useFirmStore();
  const { updateProject } = useProjectStore();

  const firmClients = useMemo(
    () => clients.filter((c) => c.firmId === firm?.id),
    [clients, firm]
  );
  const activeStaff = useMemo(
    () => users.filter((u) => u.firmId === firm?.id && u.status === "active"),
    [users, firm]
  );

  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState<Project["status"]>("active");
  const [feeStructure, setFeeStructure] = useState<Project["feeStructure"]>("per_stage");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expectedEndDate, setExpectedEndDate] = useState("");
  const [projectValue, setProjectValue] = useState("");
  const [feeAgreed, setFeeAgreed] = useState("");
  const [teamLeadId, setTeamLeadId] = useState("");
  const [staffIds, setStaffIds] = useState<string[]>([]);
  const [contractorIds, setContractorIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (project) {
      setName(project.name);
      setClientId(project.clientId);
      setStatus(project.status);
      setFeeStructure(project.feeStructure);
      setLocation(project.location ?? "");
      setStartDate(project.startDate?.slice(0, 10) ?? "");
      setExpectedEndDate(project.expectedEndDate?.slice(0, 10) ?? "");
      setProjectValue(project.projectValue != null ? String(project.projectValue) : "");
      setFeeAgreed(project.feeAgreed != null ? String(project.feeAgreed) : "");
      setTeamLeadId(project.teamLeadId ?? "");
      setStaffIds(project.staffIds ?? []);
      setContractorIds(project.contractorIds ?? []);
      setDescription(project.description ?? "");
      setError("");
    }
  }, [project]);

  const toggleStaff = (id: string) => {
    setStaffIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleContractor = (id: string) => {
    setContractorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!firm || !user || !project) return;
    if (!name.trim()) return setError("Project name is required.");
    if (!clientId) return setError("Select a client.");
    if (!teamLeadId) return setError("Assign a team lead.");

    const selectedClient = firmClients.find((c) => c.id === clientId);

    updateProject(project.id, {
      name: name.trim(),
      clientId,
      clientName: selectedClient?.name ?? project.clientName,
      status,
      feeStructure,
      location,
      startDate: startDate || project.startDate,
      expectedEndDate: expectedEndDate || project.expectedEndDate,
      projectValue: projectValue ? Number(projectValue) : undefined,
      feeAgreed: feeAgreed ? Number(feeAgreed) : 0,
      teamLeadId,
      staffIds,
      contractorIds,
      description: description || undefined,
      updatedAt: nowIso(),
    });

    toast(`Project "${name.trim()}" updated`, "success");
    onClose();
  };

  if (!project) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Edit Project" width={520}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {error && (
          <div
            style={{
              background: "var(--color-destructive-muted)",
              color: "var(--color-destructive)",
              fontSize: "var(--text-sm)",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-destructive)",
            }}
          >
            {error}
          </div>
        )}

        <Field label="Project Name" required>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Meera Nair Residence"
            style={inputStyle}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Client" required>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select client…</option>
              {firmClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Project["status"])}
              style={inputStyle}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Start Date">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Expected End">
            <input
              type="date"
              value={expectedEndDate}
              onChange={(e) => setExpectedEndDate(e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="Location">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Kunnamangalam, Kozhikode"
            style={inputStyle}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Project Value (₹)">
            <input
              type="number"
              min={0}
              value={projectValue}
              onChange={(e) => setProjectValue(e.target.value)}
              placeholder="e.g., 8500000"
              style={inputStyle}
            />
          </Field>
          <Field label="Agreed Fee (₹)">
            <input
              type="number"
              min={0}
              value={feeAgreed}
              onChange={(e) => setFeeAgreed(e.target.value)}
              placeholder="e.g., 680000"
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="Fee Structure">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 6,
              background: "var(--color-bg-input)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: 3,
            }}
          >
            {FEE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFeeStructure(opt.value)}
                style={{
                  background:
                    feeStructure === opt.value ? "var(--color-bg-card-hover)" : "transparent",
                  border: "none",
                  borderRadius: "calc(var(--radius-sm) - 2px)",
                  padding: "7px 4px",
                  fontSize: "var(--text-xs)",
                  fontWeight: feeStructure === opt.value ? 600 : 400,
                  color:
                    feeStructure === opt.value
                      ? "var(--color-text-primary)"
                      : "var(--color-text-muted)",
                  cursor: "pointer",
                  transition: "all var(--duration-fast)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Team Lead" required>
            <select
              value={teamLeadId}
              onChange={(e) => setTeamLeadId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select lead…</option>
              {activeStaff
                .filter((u) => u.role === "admin" || u.role === "team_lead")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.designation})
                  </option>
                ))}
            </select>
          </Field>

          <Field label="Staff">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                minHeight: 38,
                padding: "6px 8px",
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {activeStaff
                .filter((u) => u.id !== teamLeadId)
                .map((u) => {
                  const active = staffIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleStaff(u.id)}
                      title={u.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "3px 8px 3px 3px",
                        borderRadius: 999,
                        border: active
                          ? "1px solid var(--color-accent)"
                          : "1px solid var(--color-border)",
                        background: active ? "var(--color-accent-muted)" : "var(--color-bg-card)",
                        cursor: "pointer",
                        fontSize: "var(--text-xs)",
                        color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
                        transition: "all var(--duration-fast)",
                      }}
                    >
                      <Avatar
                        name={u.name}
                        color={u.avatarColor}
                        initials={u.avatarInitials}
                        size="sm"
                      />
                      {u.name.split(" ")[0]}
                    </button>
                  );
                })}
            </div>
          </Field>
        </div>

        <Field label="Contractors">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              minHeight: 38,
              padding: "6px 8px",
              background: "var(--color-bg-input)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {contractors
              .filter((c) => c.firmId === firm?.id)
              .map((c) => {
                const active = contractorIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleContractor(c.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px",
                      borderRadius: 999,
                      border: active
                        ? "1px solid var(--color-accent)"
                        : "1px solid var(--color-border)",
                      background: active ? "var(--color-accent-muted)" : "var(--color-bg-card)",
                      cursor: "pointer",
                      fontSize: "var(--text-xs)",
                      color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
                      transition: "all var(--duration-fast)",
                    }}
                  >
                    {active ? <X size={10} strokeWidth={2} /> : <Plus size={10} strokeWidth={2} />}
                    {c.company} · {c.trade}
                  </button>
                );
              })}
            {contractors.filter((c) => c.firmId === firm?.id).length === 0 && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                No contractors on file
              </span>
            )}
          </div>
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the project…"
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            paddingTop: 8,
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <button type="button" onClick={onClose} style={ghostBtnStyle}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} style={primaryBtnStyle}>
            Save Changes
          </button>
        </div>
      </div>
    </Drawer>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--color-bg-input)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  padding: "8px 12px",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-primary)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color var(--duration-fast)",
};

const primaryBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "var(--color-accent)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-sm)",
  padding: "8px 18px",
  fontSize: "var(--text-sm)",
  fontWeight: 500,
  cursor: "pointer",
  transition: "background var(--duration-fast)",
};

const ghostBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--color-border)",
  color: "var(--color-text-secondary)",
  borderRadius: "var(--radius-sm)",
  padding: "8px 18px",
  fontSize: "var(--text-sm)",
  cursor: "pointer",
  transition: "all var(--duration-fast)",
};

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
        }}
      >
        {label}
        {required && <span style={{ color: "var(--color-destructive)" }}> *</span>}
      </span>
      {children}
    </label>
  );
}
