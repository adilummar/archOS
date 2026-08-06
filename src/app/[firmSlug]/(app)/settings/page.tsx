"use client";
/**
 * Settings — admin-only firm configuration hub.
 * Sections: Firm Profile | Staff & Roles | Portal Settings | Leave Settings | Notification Preferences
 */

import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  Globe,
  CalendarDays,
  Bell,
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Ban,
  ShieldOff,
  Check,
  LayoutTemplate,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuthStore } from "@/lib/store/auth.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { toast } from "@/lib/store/toast.store";
import { Avatar } from "@/components/shared/Avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { User, Role, ProjectTemplate, TemplateStage, FileCategory } from "@/lib/store/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
  | "firm-profile"
  | "staff-roles"
  | "project-templates"
  | "portal-settings"
  | "leave-settings"
  | "notifications";

interface NavItem {
  id: Section;
  label: string;
  icon: React.ReactNode;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({
  height,
  width = "100%",
}: {
  height: number;
  width?: string | number;
}) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: "var(--radius-sm)",
        background: "var(--color-bg-card)",
        position: "relative",
        overflow: "hidden",
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

function SettingsSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        minHeight: "calc(100vh - 60px)",
      }}
    >
      {/* Sidebar skeleton */}
      <div
        style={{
          width: 220,
          borderRight: "1px solid var(--color-border)",
          padding: "28px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <SkeletonBlock height={16} width={80} />
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} height={36} />
          ))}
        </div>
      </div>
      {/* Content skeleton */}
      <div
        style={{
          flex: 1,
          padding: "28px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <SkeletonBlock height={36} width={200} />
        <SkeletonBlock height={20} width={300} />
        <SkeletonBlock height={120} />
        <SkeletonBlock height={64} />
        <SkeletonBlock height={64} />
        <SkeletonBlock height={64} />
      </div>
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "var(--text-lg)",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        color: "var(--color-text-primary)",
        margin: "0 0 4px",
        letterSpacing: "-0.02em",
      }}
    >
      {children}
    </h2>
  );
}

function SectionSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "var(--text-sm)",
        color: "var(--color-text-muted)",
        margin: "0 0 24px",
      }}
    >
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        color: "var(--color-text-muted)",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginBottom: 6,
      }}
    >
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  disabled = false,
  type = "text",
  placeholder = "",
}: {
  value: string | number;
  onChange: (v: string) => void;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "8px 12px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--color-border)",
        background: disabled ? "var(--color-bg-canvas)" : "var(--color-bg-input)",
        color: disabled ? "var(--color-text-muted)" : "var(--color-text-primary)",
        fontSize: "var(--text-sm)",
        outline: "none",
        transition: "border-color var(--duration-fast)",
        cursor: disabled ? "not-allowed" : "text",
        boxSizing: "border-box",
      }}
      onFocus={(e) => {
        if (!disabled) e.target.style.borderColor = "var(--color-accent)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "var(--color-border)";
      }}
    />
  );
}

function Select({
  value,
  onChange,
  options,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "8px 12px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--color-border)",
        background: disabled ? "var(--color-bg-canvas)" : "var(--color-bg-input)",
        color: disabled ? "var(--color-text-muted)" : "var(--color-text-primary)",
        fontSize: "var(--text-sm)",
        outline: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        boxSizing: "border-box",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function PrimaryButton({
  onClick,
  children,
  icon,
  variant = "primary",
  disabled = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "primary" | "ghost" | "danger" | "muted";
  disabled?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: "var(--color-accent)",
      color: "var(--color-text-inverse)",
      border: "none",
    },
    ghost: {
      background: "transparent",
      color: "var(--color-text-secondary)",
      border: "1px solid var(--color-border)",
    },
    danger: {
      background: "transparent",
      color: "var(--color-destructive)",
      border: "1px solid var(--color-destructive)",
    },
    muted: {
      background: "var(--color-bg-input)",
      color: "var(--color-text-muted)",
      border: "1px solid var(--color-border)",
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 14px",
        borderRadius: "var(--radius-sm)",
        fontSize: "var(--text-sm)",
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all var(--duration-fast)",
        opacity: disabled ? 0.5 : 1,
        whiteSpace: "nowrap",
        ...styles[variant],
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === "primary") e.currentTarget.style.background = "var(--color-accent-hover)";
        if (variant === "ghost") e.currentTarget.style.background = "var(--color-bg-card-hover)";
        if (variant === "danger") e.currentTarget.style.background = "var(--color-destructive-muted)";
        if (variant === "muted") e.currentTarget.style.background = "var(--color-bg-card-hover)";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        if (variant === "primary") e.currentTarget.style.background = "var(--color-accent)";
        if (variant === "ghost") e.currentTarget.style.background = "transparent";
        if (variant === "danger") e.currentTarget.style.background = "transparent";
        if (variant === "muted") e.currentTarget.style.background = "var(--color-bg-input)";
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <span
        onClick={() => onChange(!checked)}
        style={{
          position: "relative",
          display: "inline-block",
          width: 40,
          height: 22,
          borderRadius: 11,
          background: checked ? "var(--color-accent)" : "var(--color-bg-card-hover)",
          border: `1px solid ${checked ? "var(--color-accent)" : "var(--color-border)"}`,
          transition: "all var(--duration-base)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: checked ? "var(--color-text-inverse)" : "var(--color-text-muted)",
            transition: "left var(--duration-base)",
          }}
        />
      </span>
      {label && (
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          {label}
        </span>
      )}
    </label>
  );
}

function Divider() {
  return (
    <div
      style={{
        borderTop: "1px solid var(--color-border)",
        margin: "24px 0",
      }}
    />
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "20px 24px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Section 1: Firm Profile ──────────────────────────────────────────────────

function FirmProfileSection() {
  const { firm: authFirm } = useAuthStore();
  const { firms, updateFirm } = useFirmStore();
  const liveFirm = firms.find((f) => f.id === authFirm?.id) ?? authFirm;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: liveFirm?.name ?? "",
    address: liveFirm?.address ?? "",
    phone: liveFirm?.phone ?? "",
    email: liveFirm?.email ?? "",
    gstin: liveFirm?.gstin ?? "",
    website: liveFirm?.website ?? "",
  });

  const handleSave = () => {
    if (!liveFirm) return;
    updateFirm(liveFirm.id, form);
    toast("Firm profile saved", "success");
    setEditing(false);
  };

  const handleCancel = () => {
    setForm({
      name: liveFirm?.name ?? "",
      address: liveFirm?.address ?? "",
      phone: liveFirm?.phone ?? "",
      email: liveFirm?.email ?? "",
      gstin: liveFirm?.gstin ?? "",
      website: liveFirm?.website ?? "",
    });
    setEditing(false);
  };

  const planLabels: Record<string, string> = {
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
  };

  return (
    <div>
      <SectionTitle>Firm Profile</SectionTitle>
      <SectionSubtitle>Basic details about your architecture firm.</SectionSubtitle>

      <Card>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "var(--radius-md)",
                background: "var(--color-accent-muted)",
                border: "1px solid var(--color-accent-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-accent)",
                flexShrink: 0,
              }}
            >
              <Building2 size={22} strokeWidth={1.5} />
            </div>
            <div>
              <p
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                {liveFirm?.name ?? "—"}
              </p>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "2px 0 0" }}>
                {liveFirm?.email ?? "—"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusBadge
              status={liveFirm?.planType ?? "starter"}
              label={planLabels[liveFirm?.planType ?? "starter"] ?? liveFirm?.planType ?? "—"}
            />
            {!editing ? (
              <PrimaryButton
                onClick={() => setEditing(true)}
                icon={<Edit2 size={13} strokeWidth={2} />}
                variant="ghost"
              >
                Edit
              </PrimaryButton>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <PrimaryButton
                  onClick={handleCancel}
                  icon={<X size={13} strokeWidth={2} />}
                  variant="ghost"
                >
                  Cancel
                </PrimaryButton>
                <PrimaryButton
                  onClick={handleSave}
                  icon={<Save size={13} strokeWidth={2} />}
                >
                  Save Changes
                </PrimaryButton>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          <div>
            <FieldLabel>Firm Name</FieldLabel>
            <Input
              value={form.name}
              onChange={(v) => setForm((p) => ({ ...p, name: v }))}
              disabled={!editing}
              placeholder="Your Architecture Studio"
            />
          </div>
          <div>
            <FieldLabel>Phone</FieldLabel>
            <Input
              value={form.phone}
              onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
              disabled={!editing}
              placeholder="+91 98765 43210"
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <FieldLabel>Address</FieldLabel>
            <Input
              value={form.address}
              onChange={(v) => setForm((p) => ({ ...p, address: v }))}
              disabled={!editing}
              placeholder="123 Studio Lane, City, State"
            />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <Input
              value={form.email}
              onChange={(v) => setForm((p) => ({ ...p, email: v }))}
              disabled={!editing}
              placeholder="studio@example.com"
            />
          </div>
          <div>
            <FieldLabel>GSTIN</FieldLabel>
            <Input
              value={form.gstin}
              onChange={(v) => setForm((p) => ({ ...p, gstin: v }))}
              disabled={!editing}
              placeholder="22AAAAA0000A1Z5"
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <FieldLabel>Website</FieldLabel>
            <Input
              value={form.website ?? ""}
              onChange={(v) => setForm((p) => ({ ...p, website: v }))}
              disabled={!editing}
              placeholder="https://yourstudio.com"
            />
          </div>
        </div>

        {editing && (
          <div
            style={{
              marginTop: 20,
              padding: "10px 14px",
              background: "var(--color-accent-muted)",
              border: "1px solid var(--color-accent-strong)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--text-xs)",
              color: "var(--color-accent)",
            }}
          >
            You are in edit mode. All changes are saved to the local store.
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Section 2: Staff & Roles ─────────────────────────────────────────────────

interface StaffRowState {
  role: Role;
  costRatePerHour: string;
}

function StaffRow({
  user,
  onSave,
  onDiscontinue,
  onReactivate,
}: {
  user: User;
  onSave: (id: string, patch: { role: Role; costRatePerHour: number }) => void;
  onDiscontinue: (id: string) => void;
  onReactivate: (id: string) => void;
}) {
  const isDiscontinued = user.status === "discontinued";
  const [row, setRow] = useState<StaffRowState>({
    role: user.role,
    costRatePerHour: String(user.costRatePerHour),
  });

  const roleOptions: { value: Role; label: string }[] = [
    { value: "admin", label: "Admin" },
    { value: "team_lead", label: "Team Lead" },
    { value: "staff", label: "Staff" },
    { value: "accounts", label: "Accounts" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr 1fr 140px 120px auto",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--color-border)",
        background: isDiscontinued ? "transparent" : "var(--color-bg-canvas)",
        opacity: isDiscontinued ? 0.55 : 1,
      }}
    >
      {/* Avatar */}
      <Avatar
        name={user.name}
        initials={user.avatarInitials}
        color={user.avatarColor}
        size="md"
      />

      {/* Name + email */}
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            color: "var(--color-text-primary)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user.name}
        </p>
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            margin: "2px 0 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user.email}
        </p>
      </div>

      {/* Designation */}
      <p
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-muted)",
          margin: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {user.designation}
      </p>

      {/* Role dropdown */}
      <Select
        value={row.role}
        onChange={(v) => setRow((p) => ({ ...p, role: v as Role }))}
        options={roleOptions}
        disabled={isDiscontinued}
      />

      {/* Cost rate */}
      <Input
        type="number"
        value={row.costRatePerHour}
        onChange={(v) => setRow((p) => ({ ...p, costRatePerHour: v }))}
        disabled={isDiscontinued}
        placeholder="₹/hr"
      />

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        {isDiscontinued ? (
          <PrimaryButton
            onClick={() => onReactivate(user.id)}
            icon={<RotateCcw size={12} strokeWidth={2} />}
            variant="muted"
          >
            Reactivate
          </PrimaryButton>
        ) : (
          <>
            <PrimaryButton
              onClick={() =>
                onSave(user.id, {
                  role: row.role,
                  costRatePerHour: parseFloat(row.costRatePerHour) || 0,
                })
              }
              icon={<Save size={12} strokeWidth={2} />}
              variant="ghost"
            >
              Save
            </PrimaryButton>
            <PrimaryButton
              onClick={() => onDiscontinue(user.id)}
              icon={<Ban size={12} strokeWidth={2} />}
              variant="danger"
            >
              Discontinue
            </PrimaryButton>
          </>
        )}
      </div>
    </div>
  );
}

function StaffRolesSection() {
  const { firm: authFirm } = useAuthStore();
  const { users, updateUser, discontinueUser } = useFirmStore();
  const [showDiscontinued, setShowDiscontinued] = useState(false);

  const firmUsers = users.filter((u) => u.firmId === authFirm?.id);
  const active = firmUsers.filter((u) => u.status === "active");
  const discontinued = firmUsers.filter((u) => u.status === "discontinued");

  const handleSave = (id: string, patch: { role: Role; costRatePerHour: number }) => {
    updateUser(id, patch);
    toast("Staff member updated", "success");
  };

  const handleDiscontinue = (id: string) => {
    discontinueUser(id);
    toast("Staff member discontinued", "warning");
  };

  const handleReactivate = (id: string) => {
    updateUser(id, { status: "active", discontinuedAt: undefined });
    toast("Staff member reactivated", "success");
  };

  return (
    <div>
      <SectionTitle>Staff &amp; Roles</SectionTitle>
      <SectionSubtitle>
        Manage team members, their roles, designations, and cost rates.
      </SectionSubtitle>

      {/* Column headers */}
      {active.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr 1fr 140px 120px auto",
            gap: 12,
            padding: "0 16px 8px",
          }}
        >
          {["", "Name / Email", "Designation", "Role", "Cost (₹/hr)", ""].map((h, i) => (
            <span
              key={i}
              style={{
                fontSize: "var(--text-xs)",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {h}
            </span>
          ))}
        </div>
      )}

      {/* Active staff */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {active.length === 0 ? (
          <Card>
            <p
              style={{
                textAlign: "center",
                color: "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
                padding: "24px 0",
                margin: 0,
              }}
            >
              No staff yet — invite team members to get started.
            </p>
          </Card>
        ) : (
          active.map((u) => (
            <StaffRow
              key={u.id}
              user={u}
              onSave={handleSave}
              onDiscontinue={handleDiscontinue}
              onReactivate={handleReactivate}
            />
          ))
        )}
      </div>

      {/* Discontinued section */}
      {discontinued.length > 0 && (
        <>
          <Divider />
          <button
            onClick={() => setShowDiscontinued((p) => !p)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              padding: "0 0 12px",
            }}
          >
            {showDiscontinued ? (
              <ChevronDown size={14} strokeWidth={2} />
            ) : (
              <ChevronRight size={14} strokeWidth={2} />
            )}
            Discontinued Staff ({discontinued.length})
          </button>

          {showDiscontinued && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {discontinued.map((u) => (
                <StaffRow
                  key={u.id}
                  user={u}
                  onSave={handleSave}
                  onDiscontinue={handleDiscontinue}
                  onReactivate={handleReactivate}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Section 3: Portal Settings ───────────────────────────────────────────────

function PortalSettingsSection() {
  const { firm: authFirm } = useAuthStore();
  const { firms, updateFirmSettings } = useFirmStore();
  const liveFirm = firms.find((f) => f.id === authFirm?.id) ?? authFirm;
  const s = liveFirm?.settings;

  const [form, setForm] = useState({
    defaultFileRequestWindowDays: String(s?.defaultFileRequestWindowDays ?? 7),
    clientApprovalReminderDays: String(s?.clientApprovalReminderDays ?? 3),
    clientApprovalEscalateDays: String(s?.clientApprovalEscalateDays ?? 7),
    maxClientSessions: String(s?.maxClientSessions ?? 3),
    drawingNumberingEnabled: s?.drawingNumberingEnabled ?? true,
  });

  const handleSave = () => {
    if (!liveFirm) return;
    updateFirmSettings(liveFirm.id, {
      defaultFileRequestWindowDays: parseInt(form.defaultFileRequestWindowDays) || 7,
      clientApprovalReminderDays: parseInt(form.clientApprovalReminderDays) || 3,
      clientApprovalEscalateDays: parseInt(form.clientApprovalEscalateDays) || 7,
      maxClientSessions: parseInt(form.maxClientSessions) || 3,
      drawingNumberingEnabled: form.drawingNumberingEnabled,
    });
    toast("Portal settings saved", "success");
  };

  const numberInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--color-border)",
    background: "var(--color-bg-input)",
    color: "var(--color-text-primary)",
    fontSize: "var(--text-sm)",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div>
      <SectionTitle>Portal Settings</SectionTitle>
      <SectionSubtitle>
        Configure client-portal behaviour, file request windows, and session limits.
      </SectionSubtitle>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Row 1 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <FieldLabel>File Request Window (days)</FieldLabel>
              <input
                type="number"
                min={1}
                value={form.defaultFileRequestWindowDays}
                onChange={(e) =>
                  setForm((p) => ({ ...p, defaultFileRequestWindowDays: e.target.value }))
                }
                style={numberInputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
                Default window clients have to fulfil file requests.
              </p>
            </div>
            <div>
              <FieldLabel>Max Client Sessions</FieldLabel>
              <input
                type="number"
                min={1}
                max={10}
                value={form.maxClientSessions}
                onChange={(e) =>
                  setForm((p) => ({ ...p, maxClientSessions: e.target.value }))
                }
                style={numberInputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
                Maximum concurrent portal login sessions per client.
              </p>
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <FieldLabel>Client Approval Reminder (days)</FieldLabel>
              <input
                type="number"
                min={1}
                value={form.clientApprovalReminderDays}
                onChange={(e) =>
                  setForm((p) => ({ ...p, clientApprovalReminderDays: e.target.value }))
                }
                style={numberInputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
                Days before sending a reminder for pending client approvals.
              </p>
            </div>
            <div>
              <FieldLabel>Client Approval Escalate (days)</FieldLabel>
              <input
                type="number"
                min={1}
                value={form.clientApprovalEscalateDays}
                onChange={(e) =>
                  setForm((p) => ({ ...p, clientApprovalEscalateDays: e.target.value }))
                }
                style={numberInputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
                Days after which an unresolved approval escalates to admin.
              </p>
            </div>
          </div>

          {/* Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-canvas)",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                Drawing Numbering Enabled
              </p>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                  margin: "2px 0 0",
                }}
              >
                Automatically assign drawing numbers (e.g. A-001, S-003) to new files.
              </p>
            </div>
            <Toggle
              checked={form.drawingNumberingEnabled}
              onChange={(v) => setForm((p) => ({ ...p, drawingNumberingEnabled: v }))}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <PrimaryButton
              onClick={handleSave}
              icon={<Save size={14} strokeWidth={2} />}
            >
              Save Settings
            </PrimaryButton>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Section 4: Leave Settings ────────────────────────────────────────────────

function LeaveSettingsSection() {
  const { firm: authFirm } = useAuthStore();
  const [annualEntitlement, setAnnualEntitlement] = useState("21");

  const handleSave = () => {
    toast("Leave settings saved", "success");
  };

  return (
    <div>
      <SectionTitle>Leave Settings</SectionTitle>
      <SectionSubtitle>
        Configure leave policies and annual entitlements for your team.
      </SectionSubtitle>

      {/* Info card */}
      <Card style={{ marginBottom: 16, background: "var(--color-bg-canvas)" }}>
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
          }}
        >
          <CalendarDays
            size={20}
            strokeWidth={1.5}
            style={{ color: "var(--color-accent)", flexShrink: 0, marginTop: 2 }}
          />
          <div>
            <p
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                margin: "0 0 6px",
              }}
            >
              How leave works in ArchStudio
            </p>
            <ul
              style={{
                margin: 0,
                padding: "0 0 0 18px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {[
                "Staff submit leave requests specifying start date, end date, and reason.",
                "Requests go to admin for approval or rejection.",
                "Approved leave is automatically reflected in the attendance module.",
                "Annual entitlement is used to track remaining leave balance per staff member.",
                "Carry-forward policies are not yet automated — manage manually for now.",
              ].map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ maxWidth: 280 }}>
            <FieldLabel>Annual Leave Entitlement (days/year)</FieldLabel>
            <input
              type="number"
              min={0}
              max={365}
              value={annualEntitlement}
              onChange={(e) => setAnnualEntitlement(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-input)",
                color: "var(--color-text-primary)",
                fontSize: "var(--text-sm)",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
            />
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-muted)",
                margin: "4px 0 0",
              }}
            >
              Number of paid leave days each staff member is entitled to per calendar year.
            </p>
          </div>

          <div
            style={{
              padding: "12px 16px",
              background: "var(--color-warning-muted)",
              border: "1px solid var(--color-warning)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--text-xs)",
              color: "var(--color-warning)",
            }}
          >
            <strong>Note:</strong> Changing entitlement does not retroactively recalculate
            past leave balances. Effective from the next leave cycle.
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <PrimaryButton
              onClick={handleSave}
              icon={<Save size={14} strokeWidth={2} />}
            >
              Save Leave Settings
            </PrimaryButton>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Section 5: Notification Preferences ─────────────────────────────────────

interface NotifPref {
  key: string;
  label: string;
  description: string;
  group: string;
}

const NOTIF_PREFS: NotifPref[] = [
  // Tasks
  {
    key: "task_assigned",
    label: "Task assigned to me",
    description: "When a task is assigned to you",
    group: "Tasks",
  },
  {
    key: "task_due_today",
    label: "Task due today",
    description: "Daily reminder for tasks due today",
    group: "Tasks",
  },
  {
    key: "task_overdue",
    label: "Overdue task alert",
    description: "When a task becomes overdue",
    group: "Tasks",
  },
  // Approvals
  {
    key: "client_approval_needed",
    label: "Client approval requested",
    description: "When a stage is sent for client approval",
    group: "Approvals",
  },
  {
    key: "client_approval_overdue",
    label: "Client approval overdue",
    description: "When a client hasn't responded past the escalation window",
    group: "Approvals",
  },
  // Requests
  {
    key: "change_request_new",
    label: "New change request",
    description: "When a contractor raises a change request",
    group: "Requests",
  },
  {
    key: "rfi_new",
    label: "New RFI",
    description: "When a new RFI is raised on a project",
    group: "Requests",
  },
  {
    key: "file_request_new",
    label: "New file request",
    description: "When a client requests a file",
    group: "Requests",
  },
  // Finance
  {
    key: "invoice_created",
    label: "Invoice created",
    description: "When a new invoice is generated",
    group: "Finance",
  },
  {
    key: "invoice_overdue",
    label: "Invoice overdue",
    description: "When an invoice passes its due date unpaid",
    group: "Finance",
  },
  // Leave
  {
    key: "leave_request_new",
    label: "Leave request submitted",
    description: "When a staff member submits a leave request (admin)",
    group: "Leave",
  },
  {
    key: "leave_approved",
    label: "Leave approved",
    description: "When your leave request is approved",
    group: "Leave",
  },
  {
    key: "leave_rejected",
    label: "Leave rejected",
    description: "When your leave request is rejected",
    group: "Leave",
  },
  // Meetings
  {
    key: "meeting_scheduled",
    label: "Meeting scheduled",
    description: "When a meeting is created that you are attending",
    group: "Meetings",
  },
];

function NotificationsSection() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIF_PREFS.map((n) => [n.key, true]))
  );

  const groups = Array.from(new Set(NOTIF_PREFS.map((n) => n.group)));

  const handleSave = () => {
    toast("Notification preferences saved", "success");
  };

  return (
    <div>
      <SectionTitle>Notification Preferences</SectionTitle>
      <SectionSubtitle>
        Choose which events trigger in-app notifications for your account.
      </SectionSubtitle>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {groups.map((group) => (
            <div key={group}>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 700,
                  color: "var(--color-text-muted)",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  margin: "0 0 12px",
                }}
              >
                {group}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {NOTIF_PREFS.filter((n) => n.group === group).map((notif) => (
                  <div
                    key={notif.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-canvas)",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "var(--text-sm)",
                          fontWeight: 500,
                          color: "var(--color-text-primary)",
                          margin: 0,
                        }}
                      >
                        {notif.label}
                      </p>
                      <p
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-muted)",
                          margin: "2px 0 0",
                        }}
                      >
                        {notif.description}
                      </p>
                    </div>
                    <Toggle
                      checked={prefs[notif.key] ?? true}
                      onChange={(v) => setPrefs((p) => ({ ...p, [notif.key]: v }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <PrimaryButton
              onClick={handleSave}
              icon={<Save size={14} strokeWidth={2} />}
            >
              Save Preferences
            </PrimaryButton>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Access Denied ────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 16,
        padding: 32,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--radius-md)",
          background: "var(--color-destructive-muted)",
          border: "1px solid var(--color-destructive)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-destructive)",
        }}
      >
        <ShieldOff size={24} strokeWidth={1.5} />
      </div>
      <div style={{ textAlign: "center" }}>
        <h2
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: "0 0 6px",
          }}
        >
          Access Denied
        </h2>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            margin: 0,
            maxWidth: 360,
          }}
        >
          Settings are only available to administrators. Contact your firm admin if you
          need changes made.
        </p>
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    id: "firm-profile",
    label: "Firm Profile",
    icon: <Building2 size={15} strokeWidth={1.5} />,
  },
  {
    id: "staff-roles",
    label: "Staff & Roles",
    icon: <Users size={15} strokeWidth={1.5} />,
  },
  {
    id: "project-templates",
    label: "Project Templates",
    icon: <LayoutTemplate size={15} strokeWidth={1.5} />,
  },
  {
    id: "portal-settings",
    label: "Portal Settings",
    icon: <Globe size={15} strokeWidth={1.5} />,
  },
  {
    id: "leave-settings",
    label: "Leave Settings",
    icon: <CalendarDays size={15} strokeWidth={1.5} />,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell size={15} strokeWidth={1.5} />,
  },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [ready, setReady] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("firm-profile");

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (!user) return null;

  if (!ready) return <SettingsSkeleton />;

  if (user.role !== "admin") return <AccessDenied />;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          minHeight: "calc(100vh - 60px)",
          background: "var(--color-bg-canvas)",
        }}
      >
        {/* ── Left sidebar nav ── */}
        <aside
          style={{
            width: 228,
            flexShrink: 0,
            borderRight: "1px solid var(--color-border)",
            padding: "28px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            position: "sticky",
            top: 60,
            height: "calc(100vh - 60px)",
            overflowY: "auto",
          }}
        >
          <p
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "0 10px 10px",
              margin: 0,
            }}
          >
            Settings
          </p>

          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: isActive ? "var(--color-accent-muted)" : "transparent",
                  color: isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
                  fontSize: "var(--text-sm)",
                  fontWeight: isActive ? 600 : 400,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  transition: "all var(--duration-fast)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--color-bg-card-hover)";
                    e.currentTarget.style.color = "var(--color-text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                  }
                }}
              >
                <span
                  style={{
                    color: isActive ? "var(--color-accent)" : "var(--color-text-muted)",
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <span style={{ marginLeft: "auto" }}>
                    <ChevronRight size={12} strokeWidth={2} style={{ color: "var(--color-accent)" }} />
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* ── Main content ── */}
        <main
          style={{
            flex: 1,
            padding: "28px 36px",
            minWidth: 0,
            maxWidth: 900,
          }}
        >
          {/* Page heading */}
          <div style={{ marginBottom: 32 }}>
            <h1
              style={{
                fontSize: "clamp(20px, 2vw, 26px)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: "0 0 4px",
                letterSpacing: "-0.03em",
              }}
            >
              Settings
            </h1>
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text-muted)",
                margin: 0,
              }}
            >
              Manage firm configuration, team, portal, and notification preferences.
            </p>
          </div>

          {/* Section content */}
          {activeSection === "firm-profile" && <FirmProfileSection />}
          {activeSection === "staff-roles" && <StaffRolesSection />}
          {activeSection === "project-templates" && <ProjectTemplatesSection />}
          {activeSection === "portal-settings" && <PortalSettingsSection />}
          {activeSection === "leave-settings" && <LeaveSettingsSection />}
          {activeSection === "notifications" && <NotificationsSection />}
        </main>
      </div>
    </>
  );
}

// ─── Project Templates Section ──────────────────────────────────────────────

function SortableStageItem({
  stage,
  onUpdate,
  onRemove,
}: {
  stage: TemplateStage;
  onUpdate: (patch: Partial<TemplateStage>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
        padding: "12px 16px",
        position: "relative",
        zIndex: isDragging ? 10 : 1,
      }}
    >
      <div
        {...attributes}
        {...listeners}
        style={{
          cursor: "grab",
          color: "var(--color-text-muted)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <GripVertical size={16} />
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 16, alignItems: "center" }}>
        <div>
          <label style={{ fontSize: 10, color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
            STAGE NAME
          </label>
          <input
            type="text"
            value={stage.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            style={{ width: "100%", padding: "6px 10px", fontSize: "var(--text-sm)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)" }}
          />
        </div>
        <div>
          <label style={{ fontSize: 10, color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
            DURATION (DAYS)
          </label>
          <input
            type="number"
            value={stage.defaultDurationDays}
            onChange={(e) => onUpdate({ defaultDurationDays: parseInt(e.target.value) || 0 })}
            style={{ width: "100%", padding: "6px 10px", fontSize: "var(--text-sm)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16 }}>
          <input
            type="checkbox"
            checked={stage.isClientApprovalRequired}
            onChange={(e) => onUpdate({ isClientApprovalRequired: e.target.checked })}
          />
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>Client Approval</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16 }}>
          <input
            type="checkbox"
            checked={stage.isPaymentMilestone}
            onChange={(e) => onUpdate({ isPaymentMilestone: e.target.checked })}
          />
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>Payment Milestone</span>
        </div>
      </div>

      <button
        onClick={onRemove}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--color-text-muted)",
          cursor: "pointer",
          padding: 4,
        }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function ProjectTemplatesSection() {
  const { firm } = useAuthStore();
  const { templates, updateTemplate, addTemplate } = useFirmStore();
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(
    templates.find((t) => t.firmId === firm?.id)?.id || null
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!firm) return null;

  const firmTemplates = templates.filter((t) => t.firmId === firm.id);
  const activeTemplate = firmTemplates.find((t) => t.id === activeTemplateId);

  const handleAddTemplate = () => {
    const newTemp: ProjectTemplate = {
      id: `tmpl-${Date.now()}`,
      firmId: firm.id,
      name: "New Template",
      description: "Custom project template",
      stages: [],
      feeStructure: "lump_sum",
      defaultFileRequestWindowDays: 3,
      isDefault: false,
    };
    addTemplate(newTemp);
    setActiveTemplateId(newTemp.id);
    toast("Template created", "success");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!activeTemplate) return;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = activeTemplate.stages.findIndex((s) => s.id === active.id);
      const newIndex = activeTemplate.stages.findIndex((s) => s.id === over.id);

      const newStages = [...activeTemplate.stages];
      const [moved] = newStages.splice(oldIndex, 1);
      newStages.splice(newIndex, 0, moved);

      // Update order field
      newStages.forEach((s, i) => { s.order = i; });

      updateTemplate(activeTemplate.id, { stages: newStages });
    }
  };

  const handleAddStage = () => {
    if (!activeTemplate) return;
    const newStage: TemplateStage = {
      id: `stage-${Date.now()}`,
      name: "New Stage",
      order: activeTemplate.stages.length,
      defaultDurationDays: 14,
      description: "",
      isClientApprovalRequired: false,
      isPaymentMilestone: false,
      drawingTypesExpected: [],
    };
    updateTemplate(activeTemplate.id, {
      stages: [...activeTemplate.stages, newStage],
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
              Project Templates
            </h2>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              Define standardized stages and settings for new projects.
            </p>
          </div>
          <PrimaryButton onClick={handleAddTemplate} icon={<Plus size={14} />}>
            New Template
          </PrimaryButton>
        </div>

        {firmTemplates.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid var(--color-border)", paddingBottom: 16 }}>
            {firmTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTemplateId(t.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-full)",
                  border: `1px solid ${activeTemplateId === t.id ? "var(--color-accent)" : "var(--color-border)"}`,
                  background: activeTemplateId === t.id ? "var(--color-accent-muted)" : "transparent",
                  color: activeTemplateId === t.id ? "var(--color-accent)" : "var(--color-text-secondary)",
                  fontSize: "var(--text-sm)",
                  fontWeight: activeTemplateId === t.id ? 600 : 400,
                  cursor: "pointer",
                  transition: "all var(--duration-fast)",
                }}
              >
                {t.name}
                {t.isDefault && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>(Default)</span>}
              </button>
            ))}
          </div>
        )}

        {activeTemplate && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", display: "block", marginBottom: 6 }}>
                  Template Name
                </label>
                <input
                  type="text"
                  value={activeTemplate.name}
                  onChange={(e) => updateTemplate(activeTemplate.id, { name: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", fontSize: "var(--text-sm)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", display: "block", marginBottom: 6 }}>
                  Fee Structure
                </label>
                <select
                  value={activeTemplate.feeStructure}
                  onChange={(e) => updateTemplate(activeTemplate.id, { feeStructure: e.target.value as any })}
                  style={{ width: "100%", padding: "8px 12px", fontSize: "var(--text-sm)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)" }}
                >
                  <option value="lump_sum">Lump Sum</option>
                  <option value="percentage">Percentage</option>
                  <option value="per_stage">Per Stage</option>
                </select>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
                  Stages
                </h3>
                <button
                  onClick={handleAddStage}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-sm)", color: "var(--color-accent)",
                    background: "transparent", border: "none", cursor: "pointer", fontWeight: 500
                  }}
                >
                  <Plus size={14} /> Add Stage
                </button>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={activeTemplate.stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {activeTemplate.stages.map((stage) => (
                      <SortableStageItem
                        key={stage.id}
                        stage={stage}
                        onUpdate={(patch) => {
                          const newStages = activeTemplate.stages.map((s) =>
                            s.id === stage.id ? { ...s, ...patch } : s
                          );
                          updateTemplate(activeTemplate.id, { stages: newStages });
                        }}
                        onRemove={() => {
                          const newStages = activeTemplate.stages.filter((s) => s.id !== stage.id);
                          newStages.forEach((s, i) => { s.order = i; });
                          updateTemplate(activeTemplate.id, { stages: newStages });
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
