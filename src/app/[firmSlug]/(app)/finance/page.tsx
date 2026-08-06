"use client";
/**
 * Finance — firm-wide finance page.
 * Tab 1: My Expenses (all roles)
 * Tab 2: Invoices   (admin / accounts only)
 * Tab 3: Salary     (admin / accounts only)
 */

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { format, parseISO, isPast, isSameMonth } from "date-fns";
import {
  DollarSign,
  Receipt,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Loader2,
  FileText,
  Banknote,
  TrendingUp,
} from "lucide-react";
import { useFinanceStore } from "@/lib/store/finance.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { useProjectStore } from "@/lib/store/project.store";
import { toast } from "@/lib/store/toast.store";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar } from "@/components/shared/Avatar";
import type { Expense, Invoice, SalaryRecord, ExpenseCategory } from "@/lib/store/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  site_visit: "Site Visit",
  client_meeting: "Client Meeting",
  materials: "Materials",
  travel: "Travel",
  printing: "Printing",
  other: "Other",
};

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "site_visit",
  "client_meeting",
  "materials",
  "travel",
  "printing",
  "other",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rupees(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function safeFormat(dateStr: string, fmt: string): string {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div
            style={{
              height: 14,
              width: i === 2 ? "70%" : i === 5 ? "40%" : "80%",
              background: "var(--color-bg-card-hover)",
              borderRadius: "var(--radius-sm)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg, transparent 0%, var(--color-bg-sidebar) 50%, transparent 100%)",
                animation: "shimmer 1.5s infinite",
              }}
            />
          </div>
        </td>
      ))}
    </tr>
  );
}

function StatSkeleton() {
  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          height: 16,
          width: 60,
          background: "var(--color-bg-card-hover)",
          borderRadius: "var(--radius-sm)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, transparent 0%, var(--color-bg-sidebar) 50%, transparent 100%)",
            animation: "shimmer 1.5s infinite",
          }}
        />
      </div>
      <div
        style={{
          height: 28,
          width: 100,
          background: "var(--color-bg-card-hover)",
          borderRadius: "var(--radius-sm)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, transparent 0%, var(--color-bg-sidebar) 50%, transparent 100%)",
            animation: "shimmer 1.5s infinite",
          }}
        />
      </div>
    </div>
  );
}

function FinanceSkeleton() {
  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ height: 32, width: 160, background: "var(--color-bg-card)", borderRadius: "var(--radius-sm)" }} />
      <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 34, width: 120, background: "var(--color-bg-card)", borderRadius: 99 }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
      <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
  warning,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
  warning?: boolean;
}) {
  const color = accent
    ? "var(--color-accent)"
    : warning
    ? "var(--color-warning)"
    : "var(--color-text-muted)";
  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: `1px solid ${accent ? "var(--color-accent)" : warning ? "var(--color-warning)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-md)",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, color }}>
        {icon}
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          color: accent ? "var(--color-accent)" : warning ? "var(--color-warning)" : "var(--color-text-primary)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 0",
        gap: 12,
        color: "var(--color-text-muted)",
      }}
    >
      {icon}
      <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
        {title}
      </p>
      <p style={{ margin: 0, fontSize: "var(--text-xs)" }}>{sub}</p>
    </div>
  );
}

// ─── Pill Tabs ────────────────────────────────────────────────────────────────

function PillTab({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "6px 16px",
        borderRadius: 99,
        border: active ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
        background: active ? "var(--color-accent-muted)" : "transparent",
        color: active ? "var(--color-accent)" : disabled ? "var(--color-text-muted)" : "var(--color-text-secondary)",
        fontSize: "var(--text-sm)",
        fontWeight: active ? 600 : 400,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all var(--duration-fast)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ─── Table wrapper ────────────────────────────────────────────────────────────

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        overflowX: "auto",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        {children}
      </table>
    </div>
  );
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th
      style={{
        padding: "10px 16px",
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        color: "var(--color-text-muted)",
        textAlign: right ? "right" : "left",
        whiteSpace: "nowrap",
        background: "var(--color-bg-sidebar)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  right,
  style: extra,
}: {
  children?: React.ReactNode;
  right?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        padding: "11px 16px",
        fontSize: "var(--text-sm)",
        color: "var(--color-text-secondary)",
        verticalAlign: "middle",
        textAlign: right ? "right" : "left",
        borderBottom: "1px solid var(--color-border)",
        ...extra,
      }}
    >
      {children}
    </td>
  );
}

// ─── Category Badge ───────────────────────────────────────────────────────────

function CategoryBadge({ cat }: { cat: ExpenseCategory }) {
  const COLORS: Record<ExpenseCategory, { color: string; bg: string }> = {
    site_visit:     { color: "var(--color-info)",        bg: "var(--color-info-muted)" },
    client_meeting: { color: "var(--color-accent)",      bg: "var(--color-accent-muted)" },
    materials:      { color: "var(--color-warning)",     bg: "var(--color-warning-muted)" },
    travel:         { color: "var(--color-success)",     bg: "var(--color-success-muted)" },
    printing:       { color: "var(--color-text-muted)",  bg: "rgb(107 107 112 / 0.12)" },
    other:          { color: "var(--color-text-muted)",  bg: "rgb(107 107 112 / 0.12)" },
  };
  const cfg = COLORS[cat];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "var(--radius-sm)",
        fontSize: "11px",
        fontWeight: 500,
        color: cfg.color,
        background: cfg.bg,
        whiteSpace: "nowrap",
      }}
    >
      {CATEGORY_LABELS[cat]}
    </span>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────

function ActionBtn({
  label,
  onClick,
  variant = "default",
  small,
}: {
  label: string;
  onClick: () => void;
  variant?: "default" | "success" | "danger" | "warning";
  small?: boolean;
}) {
  const colorMap = {
    default: { color: "var(--color-text-secondary)", border: "var(--color-border)", hoverBg: "var(--color-bg-card-hover)", hoverColor: "var(--color-text-primary)" },
    success: { color: "var(--color-success)", border: "var(--color-success)", hoverBg: "var(--color-success-muted)", hoverColor: "var(--color-success)" },
    danger:  { color: "var(--color-destructive)", border: "var(--color-destructive)", hoverBg: "var(--color-destructive-muted)", hoverColor: "var(--color-destructive)" },
    warning: { color: "var(--color-warning)", border: "var(--color-warning)", hoverBg: "var(--color-warning-muted)", hoverColor: "var(--color-warning)" },
  };
  const cfg = colorMap[variant];
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        padding: small ? "3px 8px" : "5px 10px",
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${cfg.border}`,
        background: "transparent",
        color: cfg.color,
        fontSize: small ? "11px" : "var(--text-xs)",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all var(--duration-fast)",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = cfg.hoverBg;
        e.currentTarget.style.color = cfg.hoverColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = cfg.color;
      }}
    >
      {label}
    </button>
  );
}

// ─── Input / Select helpers ────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "var(--color-bg-input)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-text-primary)",
  fontSize: "var(--text-sm)",
  padding: "8px 10px",
  width: "100%",
  outline: "none",
};

// ─── Tab 1: My Expenses ───────────────────────────────────────────────────────

function ExpensesTab() {
  const { user, firm } = useAuthStore();
  const { users } = useFirmStore();
  const { projects } = useProjectStore();
  const { expenses, addExpense, approveExpense, rejectExpense, payExpense } = useFinanceStore();

  const isAdmin = user?.role === "admin" || user?.role === "accounts";

  const firmExpenses = useMemo(
    () => expenses.filter((e) => e.firmId === firm?.id),
    [expenses, firm]
  );

  const myExpenses = useMemo(
    () => (isAdmin ? firmExpenses : firmExpenses.filter((e) => e.userId === user?.id)),
    [firmExpenses, isAdmin, user]
  );

  const firmProjects = useMemo(
    () => projects.filter((p) => p.firmId === firm?.id),
    [projects, firm]
  );

  const now = new Date();
  const thisMonth = myExpenses.filter((e) => isSameMonth(parseISO(e.date), now));
  const totalThisMonth = thisMonth.reduce((sum, e) => sum + e.amount, 0);
  const totalPending = myExpenses.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.amount, 0);
  const totalPaid = myExpenses.filter((e) => e.status === "paid").reduce((sum, e) => sum + e.amount, 0);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: "site_visit" as ExpenseCategory,
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    projectId: "",
    receiptDescription: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!user || !firm) return;
    const amt = parseFloat(form.amount);
    if (!form.description.trim() || isNaN(amt) || amt <= 0) {
      toast("Please fill all required fields with valid values.", "error");
      return;
    }
    setSubmitting(true);
    addExpense({
      firmId: firm.id,
      userId: user.id,
      category: form.category,
      amount: amt,
      description: form.description.trim(),
      date: form.date,
      projectId: form.projectId || undefined,
      receiptDescription: form.receiptDescription.trim() || undefined,
    });
    toast("Expense submitted successfully.", "success");
    setForm({ category: "site_visit", amount: "", description: "", date: new Date().toISOString().slice(0, 10), projectId: "", receiptDescription: "" });
    setShowForm(false);
    setSubmitting(false);
  };

  const getProject = (id?: string) => firmProjects.find((p) => p.id === id);
  const getUser = (id: string) => users.find((u) => u.id === id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <StatCard label="This Month" value={rupees(totalThisMonth)} icon={<TrendingUp size={16} strokeWidth={1.5} />} />
        <StatCard label="Pending" value={rupees(totalPending)} icon={<Clock size={16} strokeWidth={1.5} />} warning={totalPending > 0} />
        <StatCard label="Paid" value={rupees(totalPaid)} icon={<CheckCircle size={16} strokeWidth={1.5} />} accent={totalPaid > 0} />
      </div>

      {/* Submit form toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)" }}>
          {isAdmin ? "All Staff Expenses" : "My Expenses"}
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: "var(--radius-sm)",
            background: showForm ? "var(--color-bg-card)" : "var(--color-accent)",
            border: showForm ? "1px solid var(--color-border)" : "none",
            color: showForm ? "var(--color-text-secondary)" : "var(--color-text-inverse)",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all var(--duration-fast)",
          }}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancel" : "Submit Expense"}
        </button>
      </div>

      {/* Submit form */}
      {showForm && (
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
            New Expense
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Category */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
                style={inputStyle}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            {/* Amount */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
                Amount (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>
            {/* Date */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
                Date *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>
            {/* Project */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
                Project (optional)
              </label>
              <select
                value={form.projectId}
                onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
                style={inputStyle}
              >
                <option value="">— None —</option>
                {firmProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {/* Description */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
                Description *
              </label>
              <input
                type="text"
                placeholder="Brief description of the expense…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>
            {/* Receipt */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>
                Receipt Description (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Invoice #1234, petrol receipt…"
                value={form.receiptDescription}
                onChange={(e) => setForm((f) => ({ ...f, receiptDescription: e.target.value }))}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                background: "transparent",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
                fontSize: "var(--text-sm)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: "8px 18px",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-accent)",
                border: "none",
                color: "var(--color-text-inverse)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {submitting && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {myExpenses.length === 0 ? (
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <EmptyState
            icon={<Receipt size={40} strokeWidth={1} opacity={0.4} />}
            title="No expenses yet"
            sub="Submit your first expense using the button above."
          />
        </div>
      ) : (
        <TableWrapper>
          <thead>
            <tr>
              <Th>Date</Th>
              {isAdmin && <Th>Staff</Th>}
              <Th>Category</Th>
              <Th>Description</Th>
              <Th>Project</Th>
              <Th right>Amount</Th>
              <Th>Status</Th>
              <Th right>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {myExpenses.map((exp) => {
              const project = getProject(exp.projectId);
              const staffUser = getUser(exp.userId);
              return (
                <tr key={exp.id}>
                  <Td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
                      {safeFormat(exp.date, "d MMM yyyy")}
                    </span>
                  </Td>
                  {isAdmin && (
                    <Td>
                      {staffUser ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Avatar name={staffUser.name} size="sm" color={staffUser.avatarColor} />
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                            {staffUser.name}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>—</span>
                      )}
                    </Td>
                  )}
                  <Td>
                    <CategoryBadge cat={exp.category} />
                  </Td>
                  <Td>
                    <div>
                      <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{exp.description}</span>
                      {exp.receiptDescription && (
                        <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
                          {exp.receiptDescription}
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    {project ? (
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-muted)",
                          background: "var(--color-bg-input)",
                          padding: "2px 7px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--color-border)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {project.name}
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>—</span>
                    )}
                  </Td>
                  <Td right>
                    <span style={{ fontWeight: 600, color: "var(--color-text-primary)", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)" }}>
                      {rupees(exp.amount)}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={exp.status} size="sm" />
                  </Td>
                  <Td right>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      {isAdmin && exp.status === "pending" && (
                        <>
                          <ActionBtn
                            label="Approve"
                            variant="success"
                            small
                            onClick={() => {
                              if (!user) return;
                              approveExpense(exp.id, user.id);
                              toast(`Expense by ${staffUser?.name ?? "staff"} approved.`, "success");
                            }}
                          />
                          <ActionBtn
                            label="Reject"
                            variant="danger"
                            small
                            onClick={() => {
                              if (!user) return;
                              rejectExpense(exp.id, user.id);
                              toast("Expense rejected.", "warning");
                            }}
                          />
                        </>
                      )}
                      {isAdmin && exp.status === "approved" && (
                        <ActionBtn
                          label="Mark Paid"
                          variant="success"
                          small
                          onClick={() => {
                            payExpense(exp.id);
                            toast("Expense marked as paid.", "success");
                          }}
                        />
                      )}
                      {!isAdmin && exp.status === "pending" && (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Awaiting review</span>
                      )}
                      {exp.status === "paid" && (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-success)" }}>✓ Paid</span>
                      )}
                      {exp.status === "rejected" && (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-destructive)" }}>✕ Rejected</span>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrapper>
      )}
    </div>
  );
}

// ─── Tab 2: Invoices ───────────────────────────────────────────────────────────

interface PaymentFormState {
  amount: string;
  date: string;
  notes: string;
}

function InvoicesTab() {
  const { firm } = useAuthStore();
  const { projects } = useProjectStore();
  const { clients } = useFirmStore();
  const { invoices, markInvoiceSent, recordPayment } = useFinanceStore();

  const [payingId, setPayingId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState<PaymentFormState>({
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const firmInvoices = useMemo(
    () =>
      invoices
        .filter((i) => i.firmId === firm?.id)
        .sort((a, b) => b.issuedDate.localeCompare(a.issuedDate)),
    [invoices, firm]
  );

  const totalInvoiced = firmInvoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = firmInvoices.reduce((s, i) => s + (i.paidAmount ?? 0), 0);
  const totalOutstanding = firmInvoices
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + (i.total - (i.paidAmount ?? 0)), 0);

  const getProject = (id: string) => projects.find((p) => p.id === id);
  const getClient = (id: string) => clients.find((c) => c.id === id);

  const handleRecordPayment = (inv: Invoice) => {
    const amt = parseFloat(payForm.amount);
    if (isNaN(amt) || amt <= 0) {
      toast("Please enter a valid payment amount.", "error");
      return;
    }
    recordPayment(inv.id, { paidAmount: amt, paidDate: payForm.date, notes: payForm.notes || undefined });
    toast(`Payment of ${rupees(amt)} recorded for ${inv.invoiceNumber}.`, "success");
    setPayingId(null);
    setPayForm({ amount: "", date: new Date().toISOString().slice(0, 10), notes: "" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <StatCard label="Total Invoiced" value={rupees(totalInvoiced)} icon={<FileText size={16} strokeWidth={1.5} />} />
        <StatCard label="Total Paid" value={rupees(totalPaid)} icon={<CheckCircle size={16} strokeWidth={1.5} />} accent={totalPaid > 0} />
        <StatCard label="Outstanding" value={rupees(totalOutstanding)} icon={<AlertTriangle size={16} strokeWidth={1.5} />} warning={totalOutstanding > 0} />
      </div>

      {firmInvoices.length === 0 ? (
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <EmptyState
            icon={<FileText size={40} strokeWidth={1} opacity={0.4} />}
            title="No invoices yet"
            sub="Invoices are created from project milestones or ad-hoc charges."
          />
        </div>
      ) : (
        <TableWrapper>
          <thead>
            <tr>
              <Th>Invoice #</Th>
              <Th>Project</Th>
              <Th>Client</Th>
              <Th>Issued</Th>
              <Th>Due</Th>
              <Th right>Total</Th>
              <Th right>Paid</Th>
              <Th>Status</Th>
              <Th right>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {firmInvoices.map((inv) => {
              const project = getProject(inv.projectId);
              const client = getClient(inv.clientId);
              const isOverdue =
                inv.status === "sent" &&
                inv.dueDate &&
                isPast(parseISO(inv.dueDate));
              const isOpen = payingId === inv.id;

              return (
                <>
                  <tr
                    key={inv.id}
                    style={{
                      borderBottom: isOpen ? "none" : "1px solid var(--color-border)",
                      borderLeft: isOverdue ? "3px solid var(--color-destructive)" : "3px solid transparent",
                    }}
                  >
                    <Td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {inv.invoiceNumber}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                        {project?.name ?? "—"}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ fontSize: "var(--text-xs)" }}>{client?.name ?? inv.clientId}</span>
                    </Td>
                    <Td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
                        {safeFormat(inv.issuedDate, "d MMM yyyy")}
                      </span>
                    </Td>
                    <Td>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--text-xs)",
                          color: isOverdue ? "var(--color-destructive)" : "var(--color-text-secondary)",
                          fontWeight: isOverdue ? 600 : 400,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {isOverdue && <AlertTriangle size={11} />}
                        {safeFormat(inv.dueDate, "d MMM yyyy")}
                      </span>
                    </Td>
                    <Td right>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {rupees(inv.total)}
                      </span>
                    </Td>
                    <Td right>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: inv.paidAmount ? "var(--color-success)" : "var(--color-text-muted)" }}>
                        {inv.paidAmount ? rupees(inv.paidAmount) : "—"}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge status={inv.status} size="sm" />
                    </Td>
                    <Td right>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        {inv.status === "draft" && (
                          <ActionBtn
                            label="Mark Sent"
                            small
                            onClick={() => {
                              markInvoiceSent(inv.id);
                              toast(`${inv.invoiceNumber} marked as sent.`, "success");
                            }}
                          />
                        )}
                        {(inv.status === "sent" || inv.status === "partially_paid") && (
                          <ActionBtn
                            label={isOpen ? "Cancel" : "Record Payment"}
                            variant={isOpen ? "default" : "success"}
                            small
                            onClick={() => {
                              if (isOpen) {
                                setPayingId(null);
                              } else {
                                setPayingId(inv.id);
                                setPayForm({ amount: String(inv.total - (inv.paidAmount ?? 0)), date: new Date().toISOString().slice(0, 10), notes: "" });
                              }
                            }}
                          />
                        )}
                        {inv.status === "paid" && (
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-success)" }}>
                            ✓ Fully Paid {inv.paidDate ? `· ${safeFormat(inv.paidDate, "d MMM")}` : ""}
                          </span>
                        )}
                      </div>
                    </Td>
                  </tr>
                  {isOpen && (
                    <tr key={`${inv.id}-pay`} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td colSpan={9} style={{ padding: "0 16px 14px" }}>
                        <div
                          style={{
                            background: "var(--color-bg-sidebar)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            padding: 14,
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                          }}
                        >
                          <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                            Record Payment — {inv.invoiceNumber}
                          </p>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 10 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>Amount (₹) *</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={payForm.amount}
                                onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                                style={{ ...inputStyle, width: "auto" }}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                              />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>Date *</label>
                              <input
                                type="date"
                                value={payForm.date}
                                onChange={(e) => setPayForm((f) => ({ ...f, date: e.target.value }))}
                                style={{ ...inputStyle, width: "auto" }}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                              />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 500 }}>Notes (optional)</label>
                              <input
                                type="text"
                                placeholder="e.g. NEFT, Cheque #…"
                                value={payForm.notes}
                                onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))}
                                style={{ ...inputStyle, width: "auto" }}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                              />
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => handleRecordPayment(inv)}
                              style={{
                                padding: "7px 16px",
                                borderRadius: "var(--radius-sm)",
                                background: "var(--color-accent)",
                                border: "none",
                                color: "var(--color-text-inverse)",
                                fontSize: "var(--text-sm)",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Confirm Payment
                            </button>
                            <button
                              onClick={() => setPayingId(null)}
                              style={{
                                padding: "7px 14px",
                                borderRadius: "var(--radius-sm)",
                                background: "transparent",
                                border: "1px solid var(--color-border)",
                                color: "var(--color-text-secondary)",
                                fontSize: "var(--text-sm)",
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </TableWrapper>
      )}
    </div>
  );
}

// ─── Tab 3: Salary ─────────────────────────────────────────────────────────────

function SalaryTab() {
  const { user, firm } = useAuthStore();
  const { users } = useFirmStore();
  const { salaries, paySalary } = useFinanceStore();

  const firmSalaries = useMemo(
    () =>
      salaries
        .filter((s) => s.firmId === firm?.id)
        .sort((a, b) => b.month.localeCompare(a.month)),
    [salaries, firm]
  );

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, SalaryRecord[]>();
    for (const s of firmSalaries) {
      const arr = map.get(s.month) ?? [];
      arr.push(s);
      map.set(s.month, arr);
    }
    return map;
  }, [firmSalaries]);

  const months = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  const getUser = (id: string) => users.find((u) => u.id === id);

  const totalPaid = firmSalaries.filter((s) => s.status === "paid").reduce((sum, s) => sum + s.amount, 0);
  const totalPending = firmSalaries.filter((s) => s.status === "pending").reduce((sum, s) => sum + s.amount, 0);
  const totalAll = firmSalaries.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <StatCard label="Total Payroll" value={rupees(totalAll)} icon={<Banknote size={16} strokeWidth={1.5} />} />
        <StatCard label="Pending" value={rupees(totalPending)} icon={<Clock size={16} strokeWidth={1.5} />} warning={totalPending > 0} />
        <StatCard label="Paid" value={rupees(totalPaid)} icon={<CheckCircle size={16} strokeWidth={1.5} />} accent={totalPaid > 0} />
      </div>

      {months.length === 0 ? (
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <EmptyState
            icon={<Users size={40} strokeWidth={1} opacity={0.4} />}
            title="No salary records"
            sub="Salary records will appear here once they are created by admin."
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {months.map((month) => {
            const records = grouped.get(month) ?? [];
            const monthPaid = records.filter((s) => s.status === "paid").reduce((sum, s) => sum + s.amount, 0);
            const monthPending = records.filter((s) => s.status === "pending").reduce((sum, s) => sum + s.amount, 0);

            return (
              <div key={month}>
                {/* Month header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 14px",
                    background: "var(--color-bg-sidebar)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    marginBottom: 0,
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>
                    {month}
                  </span>
                  <div style={{ display: "flex", gap: 16, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    {monthPaid > 0 && (
                      <span style={{ color: "var(--color-success)" }}>Paid {rupees(monthPaid)}</span>
                    )}
                    {monthPending > 0 && (
                      <span style={{ color: "var(--color-warning)" }}>Pending {rupees(monthPending)}</span>
                    )}
                  </div>
                </div>
                <TableWrapper>
                  <thead>
                    <tr>
                      <Th>Staff Member</Th>
                      <Th>Role</Th>
                      <Th>Month</Th>
                      <Th right>Amount</Th>
                      <Th>Status</Th>
                      <Th>Paid Date</Th>
                      <Th right>Action</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((sal) => {
                      const staffUser = getUser(sal.userId);
                      return (
                        <tr key={sal.id}>
                          <Td>
                            {staffUser ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Avatar name={staffUser.name} size="sm" color={staffUser.avatarColor} />
                                <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{staffUser.name}</span>
                              </div>
                            ) : (
                              <span style={{ color: "var(--color-text-muted)" }}>Unknown</span>
                            )}
                          </Td>
                          <Td>
                            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                              {staffUser?.designation ?? staffUser?.role ?? "—"}
                            </span>
                          </Td>
                          <Td>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>{sal.month}</span>
                          </Td>
                          <Td right>
                            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                              {rupees(sal.amount)}
                            </span>
                          </Td>
                          <Td>
                            <StatusBadge status={sal.status} size="sm" />
                          </Td>
                          <Td>
                            {sal.paidDate ? (
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-success)" }}>
                                {safeFormat(sal.paidDate, "d MMM yyyy")}
                              </span>
                            ) : (
                              <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>—</span>
                            )}
                          </Td>
                          <Td right>
                            {sal.status === "pending" ? (
                              <ActionBtn
                                label="Pay"
                                variant="success"
                                small
                                onClick={() => {
                                  if (!user) return;
                                  paySalary(sal.id, user.id, new Date().toISOString().slice(0, 10));
                                  toast(
                                    `Salary of ${rupees(sal.amount)} paid to ${staffUser?.name ?? "staff"} for ${sal.month}.`,
                                    "success"
                                  );
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-success)" }}>✓ Done</span>
                            )}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </TableWrapper>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type TabId = "expenses" | "invoices" | "salary";

export default function FinancePage() {
  useParams<{ firmSlug: string }>();
  const { user, firm } = useAuthStore();
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("expenses");

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (!user || !firm) return null;

  const isAdmin = user.role === "admin" || user.role === "accounts";

  if (!ready) return <FinanceSkeleton />;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        style={{
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          minHeight: "100%",
          background: "var(--color-bg-canvas)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "var(--text-xl)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Finance
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              {firm.name} · {format(new Date(), "MMMM yyyy")}
            </p>
          </div>
        </div>

        {/* Pill Tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <PillTab
            label="My Expenses"
            active={activeTab === "expenses"}
            onClick={() => setActiveTab("expenses")}
          />
          <PillTab
            label="Invoices"
            active={activeTab === "invoices"}
            onClick={() => isAdmin && setActiveTab("invoices")}
            disabled={!isAdmin}
          />
          <PillTab
            label="Salary"
            active={activeTab === "salary"}
            onClick={() => isAdmin && setActiveTab("salary")}
            disabled={!isAdmin}
          />
        </div>

        {/* Tab Content */}
        {activeTab === "expenses" && <ExpensesTab />}
        {activeTab === "invoices" && isAdmin && <InvoicesTab />}
        {activeTab === "salary" && isAdmin && <SalaryTab />}

        {/* Non-admin trying to view admin tabs */}
        {!isAdmin && activeTab !== "expenses" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 0",
              gap: 12,
              color: "var(--color-text-muted)",
            }}
          >
            <DollarSign size={44} strokeWidth={1} opacity={0.4} />
            <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text-secondary)" }}>
              Access restricted
            </p>
            <p style={{ margin: 0, fontSize: "var(--text-xs)" }}>
              This section is only available to admin and accounts users.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
