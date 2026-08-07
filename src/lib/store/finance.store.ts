import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import type {
  Expense,
  Invoice,
  InvoiceLineItem,
  InvoiceStatus,
  SalaryRecord,
} from "./types";
import { useActivityStore } from "./activity.store";
import { useNotificationStore } from "./notification.store";
import { useFirmStore } from "./firm.store";
import { useProjectStore } from "./project.store";
import { uid, nowIso } from "./uid";

const GST_RATE = 0.18; // 18% GST (CGST 9% + SGST 9%)

interface FinanceState {
  expenses: Expense[];
  invoices: Invoice[];
  salaries: SalaryRecord[];

  addExpense: (
    input: Omit<Expense, "id" | "status" | "createdAt">
  ) => void;
  approveExpense: (expenseId: string, approvedById: string) => void;
  rejectExpense: (expenseId: string, approvedById: string) => void;
  payExpense: (expenseId: string) => void;

  /** Auto-numbers INV-YYYY-NNN. GST 18% on all client invoices. */
  createInvoice: (
    input: Omit<
      Invoice,
      "id" | "invoiceNumber" | "subtotal" | "gstTotal" | "total" | "status" | "createdAt"
    >
  ) => void;
  updateInvoice: (invoiceId: string, patch: Partial<Invoice>) => void;
  addLineItem: (invoiceId: string, item: Omit<InvoiceLineItem, "id" | "gstAmount">) => void;
  markInvoiceSent: (invoiceId: string) => void;
  recordPayment: (
    invoiceId: string,
    opts: { paidAmount: number; paidDate: string; notes?: string }
  ) => void;
  /** Ad-hoc charges: admin/accounts only. Appends to open invoice or creates new. */
  addAdHocCharge: (
    projectId: string,
    opts: { description: string; amount: number; gstRate?: number }
  ) => void;

  addSalary: (input: Omit<SalaryRecord, "id" | "status" | "createdAt">) => void;
  paySalary: (salaryId: string, paidById: string, paidDate: string) => void;
}

const firmStaffIds = (firmId: string): string[] =>
  useFirmStore
    .getState()
    .users.filter((u) => u.firmId === firmId && u.status === "active")
    .map((u) => u.id);

const staffName = (userId: string): string =>
  useFirmStore.getState().users.find((u) => u.id === userId)?.name ?? "Staff";

const currentYear = () => new Date().getFullYear();

export const useFinanceStore = create<FinanceState>()(
  persist(
    immer((set, get) => ({
    expenses: [],
    invoices: [],
    salaries: [],

    addExpense: (input) => {
      const expense: Expense = {
        ...input,
        id: uid(),
        status: "pending",
        createdAt: nowIso(),
      };
      set((state) => {
        state.expenses.unshift(expense);
      });
      useActivityStore.getState().log({
        firmId: input.firmId,
        projectId: input.projectId,
        userId: input.userId,
        userName: staffName(input.userId),
        entity: "expense",
        entityId: expense.id,
        action: "created",
        description: `${staffName(input.userId)} submitted ${input.category} expense: ₹${input.amount}`,
      });
    },

    approveExpense: (expenseId, approvedById) => {
      const existing = get().expenses.find((e) => e.id === expenseId);
      set((state) => {
        const e = state.expenses.find((x) => x.id === expenseId);
        if (e) {
          e.status = "approved";
          e.approvedById = approvedById;
          e.approvedAt = nowIso();
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          userId: approvedById,
          userName: staffName(approvedById),
          entity: "expense",
          entityId: expenseId,
          action: "approved",
          description: `Expense approved by ${staffName(approvedById)}`,
        });
      }
    },

    rejectExpense: (expenseId, approvedById) => {
      const existing = get().expenses.find((e) => e.id === expenseId);
      set((state) => {
        const e = state.expenses.find((x) => x.id === expenseId);
        if (e) e.status = "rejected";
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          userId: approvedById,
          userName: staffName(approvedById),
          entity: "expense",
          entityId: expenseId,
          action: "rejected",
          description: `Expense rejected by ${staffName(approvedById)}`,
        });
      }
    },

    payExpense: (expenseId) => {
      const existing = get().expenses.find((e) => e.id === expenseId);
      set((state) => {
        const e = state.expenses.find((x) => x.id === expenseId);
        if (e) e.status = "paid";
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "expense",
          entityId: expenseId,
          action: "paid",
          description: "Expense marked paid",
        });
      }
    },

    createInvoice: (input) => {
      const firmInvoices = get().invoices.filter(
        (i) => i.firmId === input.firmId
      );
      const year = currentYear();
      const invoice: Invoice = {
        ...input,
        id: uid(),
        invoiceNumber: `INV-${year}-${String(firmInvoices.length + 1).padStart(3, "0")}`,
        lineItems: input.lineItems.map((li) => ({
          ...li,
          id: li.id ?? uid(),
          gstAmount: Math.round(li.amount * (li.gstRate ?? GST_RATE) * 100) / 100,
        })),
        subtotal: 0,
        gstTotal: 0,
        total: 0,
        status: "draft",
        createdAt: nowIso(),
      };
      // Recalculate totals
      invoice.subtotal = Math.round(
        invoice.lineItems.reduce((sum, li) => sum + li.amount, 0) * 100
      ) / 100;
      invoice.gstTotal = Math.round(
        invoice.lineItems.reduce((sum, li) => sum + li.gstAmount, 0) * 100
      ) / 100;
      invoice.total = Math.round(
        (invoice.subtotal + invoice.gstTotal) * 100
      ) / 100;

      set((state) => {
        state.invoices.unshift(invoice);
      });
      useActivityStore.getState().log({
        firmId: invoice.firmId,
        projectId: invoice.projectId,
        userId: invoice.createdById,
        userName: staffName(invoice.createdById),
        entity: "invoice",
        entityId: invoice.id,
        action: "created",
        description: `Invoice ${invoice.invoiceNumber} created — ₹${invoice.total}`,
      });
    },

    updateInvoice: (invoiceId, patch) => {
      const existing = get().invoices.find((i) => i.id === invoiceId);
      set((state) => {
        const i = state.invoices.find((x) => x.id === invoiceId);
        if (i) Object.assign(i, patch, { id: i.id });
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "invoice",
          entityId: invoiceId,
          action: "updated",
          description: `Invoice ${existing.invoiceNumber} updated`,
        });
      }
    },

    addLineItem: (invoiceId, item) => {
      const existing = get().invoices.find((i) => i.id === invoiceId);
      set((state) => {
        const i = state.invoices.find((x) => x.id === invoiceId);
        if (i) {
          i.lineItems.push({
            ...item,
            id: uid(),
            gstAmount: Math.round(item.amount * (item.gstRate ?? GST_RATE) * 100) / 100,
          });
          i.subtotal = Math.round(
            i.lineItems.reduce((sum, li) => sum + li.amount, 0) * 100
          ) / 100;
          i.gstTotal = Math.round(
            i.lineItems.reduce((sum, li) => sum + li.gstAmount, 0) * 100
          ) / 100;
          i.total = Math.round((i.subtotal + i.gstTotal) * 100) / 100;
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "invoice",
          entityId: invoiceId,
          action: "line_item_added",
          description: `Line item "${item.description}" added to ${existing.invoiceNumber}`,
        });
      }
    },

    markInvoiceSent: (invoiceId) => {
      const existing = get().invoices.find((i) => i.id === invoiceId);
      set((state) => {
        const i = state.invoices.find((x) => x.id === invoiceId);
        if (i) i.status = "sent";
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "invoice",
          entityId: invoiceId,
          action: "sent",
          description: `Invoice ${existing.invoiceNumber} sent to client`,
        });
        useNotificationStore.getState().push({
          firmId: existing.firmId,
          userIds: firmStaffIds(existing.firmId),
          type: "invoice_created",
          title: "Invoice sent",
          body: `${existing.invoiceNumber} sent — ₹${existing.total}`,
          linkTo: `/projects/${existing.projectId}?tab=finance`,
          entityId: invoiceId,
        });
      }
    },

    recordPayment: (invoiceId, opts) => {
      const existing = get().invoices.find((i) => i.id === invoiceId);
      set((state) => {
        const i = state.invoices.find((x) => x.id === invoiceId);
        if (i) {
          i.paidAmount = (i.paidAmount ?? 0) + opts.paidAmount;
          i.paidDate = opts.paidDate;
          i.paymentNotes = opts.notes;
          if (i.paidAmount >= i.total) i.status = "paid";
          else if (i.paidAmount > 0) i.status = "partially_paid";
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          projectId: existing.projectId,
          entity: "invoice",
          entityId: invoiceId,
          action: "payment",
          description: `Payment ₹${opts.paidAmount} recorded for ${existing.invoiceNumber}`,
        });
      }
    },

    addAdHocCharge: (projectId, opts) => {
      const project = useProjectStore.getState().projects.find((p) => p.id === projectId);
      if (!project) return;
      const firmInvoices = get().invoices.filter((i) => i.firmId === project.firmId);
      const year = currentYear();
      const openInvoice = firmInvoices.find(
        (i) => i.projectId === projectId && i.status === "draft"
      );
      const item: InvoiceLineItem = {
        id: uid(),
        description: opts.description,
        amount: opts.amount,
        gstRate: opts.gstRate ?? GST_RATE,
        gstAmount: Math.round(opts.amount * (opts.gstRate ?? GST_RATE) * 100) / 100,
        isAdHoc: true,
      };
      if (openInvoice) {
        set((state) => {
          const i = state.invoices.find((x) => x.id === openInvoice.id);
          if (i) {
            i.lineItems.push(item);
            i.subtotal = Math.round(
              i.lineItems.reduce((sum, li) => sum + li.amount, 0) * 100
            ) / 100;
            i.gstTotal = Math.round(
              i.lineItems.reduce((sum, li) => sum + li.gstAmount, 0) * 100
            ) / 100;
            i.total = Math.round((i.subtotal + i.gstTotal) * 100) / 100;
          }
        });
      } else {
        get().createInvoice({
          firmId: project.firmId,
          projectId,
          clientId: project.clientId,
          lineItems: [item],
          issuedDate: new Date().toISOString().slice(0, 10),
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          createdById: project.teamLeadId ?? "",
        });
      }
    },

    addSalary: (input) => {
      const salary: SalaryRecord = {
        ...input,
        id: uid(),
        status: "pending",
        createdAt: nowIso(),
      };
      set((state) => {
        state.salaries.unshift(salary);
      });
      useActivityStore.getState().log({
        firmId: input.firmId,
        userId: input.userId,
        entity: "salary",
        entityId: salary.id,
        action: "created",
        description: `Salary record for ${input.month}: ₹${input.amount}`,
      });
    },

    paySalary: (salaryId, paidById, paidDate) => {
      const existing = get().salaries.find((s) => s.id === salaryId);
      set((state) => {
        const s = state.salaries.find((x) => x.id === salaryId);
        if (s) {
          s.status = "paid";
          s.paidDate = paidDate;
          s.paidById = paidById;
        }
      });
      if (existing) {
        useActivityStore.getState().log({
          firmId: existing.firmId,
          userId: paidById,
          userName: staffName(paidById),
          entity: "salary",
          entityId: salaryId,
          action: "paid",
          description: `Salary for ${existing.month} paid by ${staffName(paidById)}`,
        });
      }
    },
  })),
    { name: "archos-finance" }
  )
);;