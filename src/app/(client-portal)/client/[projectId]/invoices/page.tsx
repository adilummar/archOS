"use client";

import { useParams } from "next/navigation";
import { useFinanceStore } from "@/lib/store/finance.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { format } from "date-fns";
import { Receipt, Download } from "lucide-react";
import { toast } from "@/lib/store/toast.store";

export default function ClientInvoicesPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const { invoices } = useFinanceStore();
  const { portalSession } = useAuthStore();
  const { firms } = useFirmStore();

  if (!portalSession) return null;

  const firm = firms[0]; // Assuming firm context is handled globally or derived
  const currency = firm?.settings.defaultCurrency || "USD";

  // Filter invoices for this specific project and client
  const clientInvoices = invoices.filter(
    (inv) => inv.projectId === projectId && inv.clientId === portalSession.entityId
  ).sort((a, b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const handleDownloadInvoice = (invoiceNumber: string) => {
    toast(`Downloading Invoice ${invoiceNumber}...`, "info");
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
          Invoices
        </h1>
        <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
          View and download your project invoices.
        </p>
      </div>

      {/* Invoices List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {clientInvoices.length === 0 ? (
          <div style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: 48,
            textAlign: "center",
            color: "var(--color-text-muted)"
          }}>
            <Receipt size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
            <p style={{ margin: 0, fontSize: "var(--text-base)" }}>No invoices have been issued yet.</p>
          </div>
        ) : (
          clientInvoices.map((invoice) => (
            <div key={invoice.id} style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}>
              {/* Invoice Header */}
              <div style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-bg-canvas)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--color-bg-input)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {invoice.invoiceNumber}
                    </h3>
                    <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      Issued: {format(new Date(invoice.issuedDate), "MMM d, yyyy")} • Due: {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <StatusBadge status={invoice.status} />
                  <button
                    onClick={() => handleDownloadInvoice(invoice.invoiceNumber)}
                    style={{
                      background: "var(--color-bg-input)",
                      border: "none",
                      color: "var(--color-text-primary)",
                      width: 36,
                      height: 36,
                      borderRadius: "var(--radius-sm)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "background var(--duration-fast)",
                    }}
                    title="Download Invoice"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>

              {/* Invoice Details */}
              <div style={{ padding: "0 24px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <th style={{ padding: "16px 0", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Description</th>
                      <th style={{ padding: "16px 0", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", textAlign: "right" }}>Amount</th>
                      <th style={{ padding: "16px 0", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", textAlign: "right" }}>GST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "16px 0", fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                          {item.description}
                          {item.isAdHoc && <span style={{ marginLeft: 8, fontSize: 10, background: "var(--color-bg-input)", padding: "2px 6px", borderRadius: 4, color: "var(--color-text-muted)" }}>Additional Charge</span>}
                        </td>
                        <td style={{ padding: "16px 0", fontSize: "var(--text-sm)", color: "var(--color-text-primary)", textAlign: "right" }}>
                          {formatCurrency(item.amount)}
                        </td>
                        <td style={{ padding: "16px 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", textAlign: "right" }}>
                          {formatCurrency(item.gstAmount)} <span style={{ fontSize: 10, opacity: 0.6 }}>({item.gstRate * 100}%)</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Totals */}
              <div style={{ padding: "20px 24px", display: "flex", justifyContent: "flex-end", background: "var(--color-bg-canvas)" }}>
                <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                    <span>Subtotal</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                    <span>Total GST</span>
                    <span>{formatCurrency(invoice.gstTotal)}</span>
                  </div>
                  <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text-primary)" }}>
                    <span>Total</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                  {invoice.paidAmount ? (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", color: "var(--color-success)", fontWeight: 500, marginTop: 4 }}>
                      <span>Amount Paid</span>
                      <span>-{formatCurrency(invoice.paidAmount)}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
