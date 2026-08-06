"use client";
/**
 * FinanceTab — project detail (4.16) — admin/accounts only
 * Fee milestone tracker, invoices list, expense summary, cost vs fee, profitability indicator.
 */

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { DollarSign, TrendingUp, TrendingDown, FileText, Receipt } from "lucide-react";
import { useFinanceStore } from "../../lib/store/finance.store";
import { useAuthStore } from "../../lib/store/auth.store";
import { StatusBadge } from "../shared/StatusBadge";
import { toast } from "../../lib/store/toast.store";
import type { Project } from "../../lib/store/types";

function formatINR(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount.toFixed(0)}`;
}

export function FinanceTab({ project }: { project: Project }) {
  const { invoices, expenses, markInvoiceSent, recordPayment } = useFinanceStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const projectInvoices = invoices.filter((i) => i.projectId === project.id);
  const projectExpenses = expenses.filter((e) => e.projectId === project.id);

  const totalInvoiced = projectInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalCollected = projectInvoices.reduce(
    (sum, i) => sum + (i.paidAmount ?? 0),
    0
  );
  const totalExpenses = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
  const feeAgreed = project.feeAgreed ?? 0;
  const profitability = feeAgreed > 0
    ? Math.round(((feeAgreed - totalExpenses) / feeAgreed) * 100)
    : 0;

  const isProfitable = profitability >= 0;

  // Stage payment milestones
  const milestones = project.stages
    .filter((s) => s.paymentMilestone)
    .map((s) => ({
      stage: s,
      milestone: s.paymentMilestone!,
    }));

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
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
        {[
          { label: "Agreed Fee", value: formatINR(feeAgreed), sub: "contract value" },
          { label: "Total Invoiced", value: formatINR(totalInvoiced), sub: `${projectInvoices.length} invoices` },
          { label: "Collected", value: formatINR(totalCollected), sub: `${totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0}% of invoiced` },
          {
            label: "Profitability",
            value: `${profitability}%`,
            sub: "fee minus expenses",
            color: isProfitable ? "var(--color-success)" : "var(--color-destructive)",
          },
          { label: "Project Expenses", value: formatINR(totalExpenses), sub: "direct costs" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "14px 16px",
            }}
          >
            <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              {stat.label}
            </p>
            <p
              style={{
                margin: "6px 0 2px",
                fontSize: "var(--text-lg)",
                fontWeight: 700,
                color: stat.color ?? "var(--color-text-primary)",
                fontFamily: "var(--font-display)",
              }}
            >
              {stat.value}
            </p>
            <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-muted)" }}>
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Fee milestone tracker */}
      {milestones.length > 0 && (
        <div>
          <h4
            style={{
              margin: "0 0 12px",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            Payment Milestones
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {milestones.map(({ stage, milestone }) => (
              <div
                key={stage.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 16px",
                  gap: 16,
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {stage.name}
                  </p>
                  {milestone.percentage && (
                    <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {milestone.percentage}% of agreed fee
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
                    {formatINR(milestone.amount)}
                  </span>
                  <StatusBadge status={milestone.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices */}
      <div>
        <h4 style={{ margin: "0 0 12px", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
          Invoices
        </h4>
        {projectInvoices.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "32px 0",
              gap: 8,
              color: "var(--color-text-muted)",
              background: "var(--color-bg-card)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            <FileText size={32} strokeWidth={1} opacity={0.4} />
            <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>No invoices for this project</p>
          </div>
        ) : (
          <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                  {["Invoice #", "Issued", "Due", "Amount", "GST", "Total", "Status", ""].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        fontSize: "var(--text-xs)",
                        fontWeight: 500,
                        color: "var(--color-text-muted)",
                        textAlign: "left",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projectInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-accent)" }}>
                      {inv.invoiceNumber}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {format(parseISO(inv.issuedDate), "d MMM yyyy")}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {format(parseISO(inv.dueDate), "d MMM yyyy")}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                      {formatINR(inv.subtotal)}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {formatINR(inv.gstTotal)}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
                      {formatINR(inv.total)}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {inv.status === "draft" && (
                        <button
                          onClick={() => {
                            markInvoiceSent(inv.id);
                            toast(`${inv.invoiceNumber} sent to client`, "success");
                          }}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--color-text-muted)",
                            fontSize: "var(--text-xs)",
                            padding: "4px 10px",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--color-text-primary)";
                            e.currentTarget.style.borderColor = "var(--color-border-strong)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--color-text-muted)";
                            e.currentTarget.style.borderColor = "var(--color-border)";
                          }}
                        >
                          Send
                        </button>
                      )}
                      {(inv.status === "sent" || inv.status === "partially_paid") && (
                        <button
                          onClick={() => {
                            recordPayment(inv.id, {
                              paidAmount: inv.total - (inv.paidAmount ?? 0),
                              paidDate: new Date().toISOString().slice(0, 10),
                            });
                            toast("Payment recorded", "success");
                          }}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--color-success)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--color-success)",
                            fontSize: "var(--text-xs)",
                            padding: "4px 10px",
                            cursor: "pointer",
                            fontWeight: 500,
                          }}
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expenses */}
      {projectExpenses.length > 0 && (
        <div>
          <h4 style={{ margin: "0 0 12px", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
            Project Expenses
          </h4>
          <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                  {["Category", "Description", "Date", "Amount", "Status"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", textAlign: "left" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projectExpenses.map((exp) => (
                  <tr key={exp.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "10px 14px", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", textTransform: "capitalize" }}>
                      {exp.category.replace(/_/g, " ")}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                      {exp.description}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {format(parseISO(exp.date), "d MMM yyyy")}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      ₹{exp.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <StatusBadge status={exp.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
