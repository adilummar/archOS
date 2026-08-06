"use client";
/**
 * seedAllStores()
 * Populates every Zustand store with two complete demo firms.
 * Uses direct setState for seeding to bypass auto-numbering and avoid
 * triggering notification/activity side-effects on boot.
 *
 * Idempotent: skips if firms are already loaded.
 */

import { useFirmStore } from "../store/firm.store";
import { useProjectStore } from "../store/project.store";
import { useTaskStore } from "../store/task.store";
import { useTimeStore } from "../store/time.store";
import { useLeaveStore } from "../store/leave.store";
import { useFileStore } from "../store/file.store";
import { useRequestStore } from "../store/request.store";
import { useVoStore } from "../store/vo.store";
import { useRfiStore } from "../store/rfi.store";
import { usePunchlistStore } from "../store/punchlist.store";
import { useSitereportStore } from "../store/sitereport.store";
import { useMeetingStore } from "../store/meeting.store";
import { useFinanceStore } from "../store/finance.store";
import { useCrmStore } from "../store/crm.store";
import { useChatStore } from "../store/chat.store";

import type {
  Firm,
  User,
  Client,
  Contractor,
  ProjectTemplate,
  TemplateStage,
  Project,
  ProjectStage,
  Task,
  TimeLog,
  LeaveRequest,
  ProjectFile,
  FileRevision,
  FileRequest,
  VariationOrder,
  RFI,
  PunchListItem,
  DailySiteReport,
  Meeting,
  Expense,
  Invoice,
  InvoiceLineItem,
  SalaryRecord,
  Lead,
  LeadNote,
  ChatMessage,
} from "../store/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const d = (offset: number): string => {
  const dt = new Date();
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString().slice(0, 10);
};

const iso = (offset: number): string => {
  const dt = new Date();
  dt.setDate(dt.getDate() + offset);
  return dt.toISOString();
};

// ─── Firm IDs ─────────────────────────────────────────────────────────────────

const CDA = "firm-cda";
const FORMA = "firm-forma";

// ─── Firms ────────────────────────────────────────────────────────────────────

export const FIRMS: Firm[] = [
  {
    id: CDA,
    name: "Coastal Design Associates",
    address: "2nd Floor, Sea Breeze Tower, Kannur Road, Kozhikode, Kerala 673001",
    phone: "+91 495 276 5432",
    email: "hello@coastaldesign.in",
    gstin: "32ABCDE1234F1Z5",
    website: "coastaldesign.in",
    planType: "professional",
    settings: {
      defaultFileRequestWindowDays: 14,
      clientApprovalReminderDays: 3,
      clientApprovalEscalateDays: 7,
      defaultCurrency: "INR",
      drawingNumberingEnabled: true,
      maxClientSessions: 3,
      portalBranding: { primaryColor: "#e55230" },
    },
    createdAt: "2023-04-10",
  },
  {
    id: FORMA,
    name: "Forma Studio",
    address: "5th Floor, Marine Square, MG Road, Kochi, Kerala 682016",
    phone: "+91 484 405 2211",
    email: "studio@formastudio.in",
    gstin: "32FGHIJ5678K2L3",
    website: "formastudio.in",
    planType: "starter",
    settings: {
      defaultFileRequestWindowDays: 10,
      clientApprovalReminderDays: 3,
      clientApprovalEscalateDays: 7,
      defaultCurrency: "INR",
      drawingNumberingEnabled: true,
      maxClientSessions: 3,
      portalBranding: { primaryColor: "#e55230" },
    },
    createdAt: "2024-09-01",
  },
];

// ─── CDA Staff (12 members) ────────────────────────────────────────────────────

export const CDA_USERS: User[] = [
  {
    id: "u-arjun", firmId: CDA, name: "Arjun Nair", email: "arjun@coastaldesign.in",
    phone: "+91 98950 12345", role: "admin", designation: "Principal Architect",
    avatarInitials: "AN", avatarColor: "#e55230",
    costRatePerHour: 2500, joinedAt: "2023-04-10", status: "active",
  },
  {
    id: "u-divya", firmId: CDA, name: "Divya Menon", email: "divya@coastaldesign.in",
    phone: "+91 98470 22334", role: "team_lead", designation: "Senior Architect",
    avatarInitials: "DM", avatarColor: "#5b8dd9",
    costRatePerHour: 1800, joinedAt: "2023-06-01", status: "active",
  },
  {
    id: "u-rahul", firmId: CDA, name: "Rahul Krishna", email: "rahul@coastaldesign.in",
    phone: "+91 97440 55667", role: "team_lead", designation: "Project Architect",
    avatarInitials: "RK", avatarColor: "#52a45e",
    costRatePerHour: 1600, joinedAt: "2023-08-15", status: "active",
  },
  {
    id: "u-priya", firmId: CDA, name: "Priya Suresh", email: "priya@coastaldesign.in",
    phone: "+91 94470 88990", role: "staff", designation: "Junior Architect",
    avatarInitials: "PS", avatarColor: "#d9a03a",
    costRatePerHour: 900, joinedAt: "2024-01-10", status: "active",
  },
  {
    id: "u-amal", firmId: CDA, name: "Amal Babu", email: "amal@coastaldesign.in",
    phone: "+91 99470 11223", role: "staff", designation: "Junior Architect",
    avatarInitials: "AB", avatarColor: "#52a45e",
    costRatePerHour: 850, joinedAt: "2024-03-01", status: "active",
  },
  {
    id: "u-sreeja", firmId: CDA, name: "Sreeja Pillai", email: "sreeja@coastaldesign.in",
    phone: "+91 96330 44556", role: "staff", designation: "Interior Designer",
    avatarInitials: "SP", avatarColor: "#a855f7",
    costRatePerHour: 1000, joinedAt: "2024-02-15", status: "active",
  },
  {
    id: "u-vishnu", firmId: CDA, name: "Vishnu Varma", email: "vishnu@coastaldesign.in",
    phone: "+91 98040 77889", role: "staff", designation: "CAD Technician",
    avatarInitials: "VV", avatarColor: "#06b6d4",
    costRatePerHour: 700, joinedAt: "2024-04-01", status: "active",
  },
  {
    id: "u-nithya", firmId: CDA, name: "Nithya Krishnan", email: "nithya@coastaldesign.in",
    phone: "+91 97890 33445", role: "staff", designation: "CAD Technician",
    avatarInitials: "NK", avatarColor: "#ec4899",
    costRatePerHour: 700, joinedAt: "2024-05-10", status: "active",
  },
  {
    id: "u-megha", firmId: CDA, name: "Megha Thomas", email: "megha@coastaldesign.in",
    phone: "+91 94470 66778", role: "accounts", designation: "Accounts Manager",
    avatarInitials: "MT", avatarColor: "#f97316",
    costRatePerHour: 1100, joinedAt: "2023-07-01", status: "active",
  },
  {
    id: "u-joseph", firmId: CDA, name: "Joseph Mathew", email: "joseph@coastaldesign.in",
    phone: "+91 98340 99001", role: "staff", designation: "Site Supervisor",
    avatarInitials: "JM", avatarColor: "#84cc16",
    costRatePerHour: 800, joinedAt: "2023-09-01", status: "active",
  },
  {
    id: "u-lekha", firmId: CDA, name: "Lekha Rajan", email: "lekha@coastaldesign.in",
    phone: "+91 97560 22334", role: "staff", designation: "Junior Architect",
    avatarInitials: "LR", avatarColor: "#e11d48",
    costRatePerHour: 850, joinedAt: "2025-01-15", status: "active",
  },
  {
    id: "u-santhosh", firmId: CDA, name: "Santhosh Kumar", email: "santhosh@coastaldesign.in",
    phone: "+91 96330 55667", role: "staff", designation: "3D Visualizer",
    avatarInitials: "SK", avatarColor: "#8b5cf6",
    costRatePerHour: 950, joinedAt: "2024-08-01", status: "active",
  },
];

// ─── CDA Clients ───────────────────────────────────────────────────────────────

export const CDA_CLIENTS: Client[] = [
  {
    id: "cl-rameshan", firmId: CDA, name: "Rameshan Pillai",
    company: "Pillai Constructions Pvt Ltd",
    phone: "+91 98470 10001", email: "rameshan@pillaiconstructions.in",
    address: "Vellimadukunnu, Kozhikode", gstin: "32PLLAI9876K1Z2",
    portalEnabled: true, notes: "Long-term client. Prefers WhatsApp updates.", createdAt: "2023-05-01",
  },
  {
    id: "cl-suma", firmId: CDA, name: "Suma George",
    phone: "+91 94470 20002", email: "suma.george@gmail.com",
    address: "Calicut University Road, Malappuram",
    portalEnabled: true, createdAt: "2023-11-15",
  },
  {
    id: "cl-krishnamoorthi", firmId: CDA, name: "K. Krishnamoorthi",
    company: "Krishnamoorthi Estates",
    phone: "+91 97890 30003", email: "krish@krishnamoorthiestates.in",
    address: "Beach Road, Kozhikode",
    portalEnabled: false, createdAt: "2024-02-10",
  },
  {
    id: "cl-fathima", firmId: CDA, name: "Fathima Beevi",
    phone: "+91 98950 40004", email: "fathima.beevi@gmail.com",
    address: "Cheruvannur, Kozhikode",
    portalEnabled: true, createdAt: "2024-06-20",
  },
];

// ─── CDA Contractors ───────────────────────────────────────────────────────────

export const CDA_CONTRACTORS: Contractor[] = [
  {
    id: "con-unity", firmId: CDA, name: "Suresh Nambiar", company: "Unity Constructions",
    trade: "Civil & Structural", phone: "+91 98470 50005",
    email: "suresh@unityconstructions.in", gstin: "32UNITY1234A1Z6", portalEnabled: true,
  },
  {
    id: "con-jayalekha", firmId: CDA, name: "Jayalekha Electricals", company: "Jayalekha Electricals",
    trade: "Electrical", phone: "+91 94470 60006", email: "jayalekha.elec@gmail.com", portalEnabled: false,
  },
  {
    id: "con-greenscape", firmId: CDA, name: "Raju Menon", company: "Greenscape Landscaping",
    trade: "Landscape", phone: "+91 97890 70007", email: "raju@greenscape.in", portalEnabled: false,
  },
];

// ─── CDA Template ─────────────────────────────────────────────────────────────

const CDA_TEMPLATE_STAGES: TemplateStage[] = [
  { id: "ts-1", name: "Concept & Brief", order: 1, defaultDurationDays: 21,
    description: "Initial brief, site study, concept ideation",
    isClientApprovalRequired: true, isPaymentMilestone: true, paymentPercentage: 15,
    drawingTypesExpected: ["architectural"] },
  { id: "ts-2", name: "Schematic Design", order: 2, defaultDurationDays: 30,
    description: "Floor plans, elevations, preliminary sections",
    isClientApprovalRequired: true, isPaymentMilestone: true, paymentPercentage: 20,
    drawingTypesExpected: ["architectural", "structural"] },
  { id: "ts-3", name: "Design Development", order: 3, defaultDurationDays: 45,
    description: "Detailed design, material specification, interior integration",
    isClientApprovalRequired: false, isPaymentMilestone: false,
    drawingTypesExpected: ["architectural", "interior", "structural"] },
  { id: "ts-4", name: "Working Drawings", order: 4, defaultDurationDays: 60,
    description: "Full construction documentation set",
    isClientApprovalRequired: false, isPaymentMilestone: true, paymentPercentage: 30,
    drawingTypesExpected: ["architectural", "structural", "electrical", "landscape"] },
  { id: "ts-5", name: "Permit & Approvals", order: 5, defaultDurationDays: 30,
    description: "Local authority submission and approval tracking",
    isClientApprovalRequired: false, isPaymentMilestone: false,
    drawingTypesExpected: ["document"] },
  { id: "ts-6", name: "Construction Supervision", order: 6, defaultDurationDays: 180,
    description: "Site visits, RFI responses, progress monitoring",
    isClientApprovalRequired: false, isPaymentMilestone: true, paymentPercentage: 25,
    drawingTypesExpected: ["architectural", "structural"] },
  { id: "ts-7", name: "Completion & Handover", order: 7, defaultDurationDays: 14,
    description: "Punch list, as-built drawings, final handover",
    isClientApprovalRequired: true, isPaymentMilestone: true, paymentPercentage: 10,
    drawingTypesExpected: ["architectural", "document"] },
];

export const CDA_TEMPLATE: ProjectTemplate = {
  id: "tmpl-cda-residential",
  firmId: CDA,
  name: "Residential Standard",
  description: "7-stage residential project workflow for Kerala houses",
  stages: CDA_TEMPLATE_STAGES,
  feeStructure: "per_stage",
  defaultFileRequestWindowDays: 14,
  isDefault: true,
};

// ─── Stage helpers ─────────────────────────────────────────────────────────────

const makeStage = (
  id: string,
  ts: TemplateStage,
  override: Partial<ProjectStage> = {}
): ProjectStage => ({
  id,
  templateStageId: ts.id,
  name: ts.name,
  order: ts.order,
  status: "pending",
  isClientApprovalRequired: ts.isClientApprovalRequired,
  description: ts.description,
  drawingTypesExpected: ts.drawingTypesExpected,
  isCustom: false,
  ...override,
});

// ─── Projects + their stages ─────────────────────────────────────────────────

// Project 1: Rameshan Villa — active, Design Development
const RV_S = CDA_TEMPLATE_STAGES.map((ts, i) =>
  makeStage(`rv-s${i + 1}`, ts,
    i === 0 ? { status: "completed", actualEndDate: d(-80), clientApprovalStatus: "approved", clientApprovedAt: d(-75) } :
    i === 1 ? { status: "completed", actualEndDate: d(-45), clientApprovalStatus: "approved", clientApprovedAt: d(-40) } :
    i === 2 ? { status: "in_progress", startDate: d(-40) } : {}
  )
);

// Project 2: Suma George — active, Working Drawings
const SG_S = CDA_TEMPLATE_STAGES.map((ts, i) =>
  makeStage(`sg-s${i + 1}`, ts,
    i === 0 ? { status: "completed", actualEndDate: d(-120), clientApprovalStatus: "approved", clientApprovedAt: d(-115) } :
    i === 1 ? { status: "completed", actualEndDate: d(-80), clientApprovalStatus: "approved", clientApprovedAt: d(-75) } :
    i === 2 ? { status: "completed", actualEndDate: d(-50) } :
    i === 3 ? { status: "in_progress", startDate: d(-50) } : {}
  )
);

// Project 3: Krishnamoorthi Commercial — active, Schematic pending client approval
const KC_S = CDA_TEMPLATE_STAGES.map((ts, i) =>
  makeStage(`kc-s${i + 1}`, ts,
    i === 0 ? { status: "completed", actualEndDate: d(-20), clientApprovalStatus: "approved", clientApprovedAt: d(-15) } :
    i === 1 ? { status: "completed", actualEndDate: d(-5), clientApprovalStatus: "pending", clientApprovalRequestedAt: d(-5) } : {}
  )
);

// Project 4: Fathima Cottage — active, Concept stage
const FC_S = CDA_TEMPLATE_STAGES.map((ts, i) =>
  makeStage(`fc-s${i + 1}`, ts,
    i === 0 ? { status: "in_progress", startDate: d(-10) } : {}
  )
);

// Project 5: Beach Club — active, Construction Supervision
const BC_S = CDA_TEMPLATE_STAGES.map((ts, i) =>
  makeStage(`bc-s${i + 1}`, ts,
    i === 0 ? { status: "completed", actualEndDate: d(-300), clientApprovalStatus: "approved", clientApprovedAt: d(-290) } :
    i === 1 ? { status: "completed", actualEndDate: d(-250), clientApprovalStatus: "approved", clientApprovedAt: d(-245) } :
    i === 2 ? { status: "completed", actualEndDate: d(-200) } :
    i === 3 ? { status: "completed", actualEndDate: d(-150) } :
    i === 4 ? { status: "completed", actualEndDate: d(-100) } :
    i === 5 ? { status: "in_progress", startDate: d(-100) } : {}
  )
);

// Project 6: Hill View — on_hold
const HV_S = CDA_TEMPLATE_STAGES.map((ts, i) =>
  makeStage(`hv-s${i + 1}`, ts,
    i === 0 ? { status: "completed", actualEndDate: d(-200), clientApprovalStatus: "approved", clientApprovedAt: d(-195) } :
    i === 1 ? { status: "in_progress", startDate: d(-195) } : {}
  )
);

// Project 7: Rameshan Office — completed
const RO_S = CDA_TEMPLATE_STAGES.map((ts, i) =>
  makeStage(`ro-s${i + 1}`, ts,
    i === 0 ? { status: "completed", actualEndDate: d(-500), clientApprovalStatus: "approved", clientApprovedAt: d(-495) } :
    i === 1 ? { status: "completed", actualEndDate: d(-440), clientApprovalStatus: "approved", clientApprovedAt: d(-435) } :
    i === 2 ? { status: "completed", actualEndDate: d(-380) } :
    i === 3 ? { status: "completed", actualEndDate: d(-300) } :
    i === 4 ? { status: "completed", actualEndDate: d(-260) } :
    i === 5 ? { status: "completed", actualEndDate: d(-120) } :
    { status: "completed", actualEndDate: d(-60), clientApprovalStatus: "approved", clientApprovedAt: d(-55) }
  )
);

export const CDA_PROJECTS: Project[] = [
  {
    id: "p-rameshan-villa", firmId: CDA, name: "Rameshan Villa — Vellimadukunnu",
    clientId: "cl-rameshan", clientName: "Rameshan Pillai",
    contractorIds: ["con-unity"], templateId: "tmpl-cda-residential", status: "active",
    stages: RV_S, currentStageId: RV_S[2].id,
    staffIds: ["u-divya", "u-priya", "u-vishnu", "u-santhosh"], teamLeadId: "u-divya",
    location: "Vellimadukunnu, Kozhikode",
    startDate: d(-80), expectedEndDate: d(200), projectValue: 8500000, feeAgreed: 680000,
    feeStructure: "per_stage", fileRequestWindowDays: 14, chatEnabled: true,
    createdAt: iso(-90), updatedAt: iso(-2),
  },
  {
    id: "p-suma-residence", firmId: CDA, name: "Suma George Residence — Malappuram",
    clientId: "cl-suma", clientName: "Suma George",
    contractorIds: ["con-unity", "con-jayalekha"], templateId: "tmpl-cda-residential", status: "active",
    stages: SG_S, currentStageId: SG_S[3].id,
    staffIds: ["u-rahul", "u-amal", "u-nithya", "u-joseph"], teamLeadId: "u-rahul",
    location: "Calicut University Road, Malappuram",
    startDate: d(-130), expectedEndDate: d(90), projectValue: 6200000, feeAgreed: 496000,
    feeStructure: "per_stage", fileRequestWindowDays: 14, chatEnabled: true,
    createdAt: iso(-135), updatedAt: iso(-1),
  },
  {
    id: "p-krish-commercial", firmId: CDA, name: "Krishnamoorthi Commercial Complex — Beach Road",
    clientId: "cl-krishnamoorthi", clientName: "K. Krishnamoorthi",
    contractorIds: [], templateId: "tmpl-cda-residential", status: "active",
    stages: KC_S, currentStageId: KC_S[1].id,
    staffIds: ["u-divya", "u-lekha", "u-santhosh"], teamLeadId: "u-divya",
    location: "Beach Road, Kozhikode",
    startDate: d(-30), expectedEndDate: d(300), projectValue: 45000000, feeAgreed: 1800000,
    feeStructure: "percentage", fileRequestWindowDays: 10, chatEnabled: false,
    createdAt: iso(-35), updatedAt: iso(-5),
  },
  {
    id: "p-fathima-cottage", firmId: CDA, name: "Fathima Cottage — Cheruvannur",
    clientId: "cl-fathima", clientName: "Fathima Beevi",
    contractorIds: [], templateId: "tmpl-cda-residential", status: "active",
    stages: FC_S, currentStageId: FC_S[0].id,
    staffIds: ["u-rahul", "u-priya"], teamLeadId: "u-rahul",
    location: "Cheruvannur, Kozhikode",
    startDate: d(-10), expectedEndDate: d(250), projectValue: 3500000, feeAgreed: 280000,
    feeStructure: "lump_sum", fileRequestWindowDays: 14, chatEnabled: true,
    createdAt: iso(-12), updatedAt: iso(-1),
  },
  {
    id: "p-beach-club", firmId: CDA, name: "Kozhikode Beach Club Renovation",
    clientId: "cl-krishnamoorthi", clientName: "K. Krishnamoorthi",
    contractorIds: ["con-unity", "con-greenscape"], templateId: "tmpl-cda-residential", status: "active",
    stages: BC_S, currentStageId: BC_S[5].id,
    staffIds: ["u-divya", "u-amal", "u-joseph", "u-sreeja"], teamLeadId: "u-divya",
    location: "Beach Road, Kozhikode",
    startDate: d(-300), expectedEndDate: d(60), projectValue: 12000000, feeAgreed: 720000,
    feeStructure: "lump_sum", fileRequestWindowDays: 7, chatEnabled: true,
    createdAt: iso(-310), updatedAt: iso(-1),
  },
  {
    id: "p-hillview-bungalow", firmId: CDA, name: "Hill View Bungalow — Thamarassery",
    clientId: "cl-rameshan", clientName: "Rameshan Pillai",
    contractorIds: [], templateId: "tmpl-cda-residential", status: "on_hold",
    stages: HV_S, currentStageId: HV_S[1].id,
    staffIds: ["u-lekha", "u-vishnu"], teamLeadId: "u-rahul",
    location: "Thamarassery, Kozhikode",
    startDate: d(-200), expectedEndDate: d(400), projectValue: 9500000, feeAgreed: 760000,
    feeStructure: "per_stage", fileRequestWindowDays: 14, chatEnabled: false,
    description: "On hold — client travelling abroad.",
    createdAt: iso(-210), updatedAt: iso(-20),
  },
  {
    id: "p-rameshan-office", firmId: CDA, name: "Rameshan Office Complex — Kozhikode",
    clientId: "cl-rameshan", clientName: "Rameshan Pillai",
    contractorIds: ["con-unity", "con-jayalekha"], templateId: "tmpl-cda-residential", status: "completed",
    stages: RO_S, currentStageId: RO_S[6].id,
    staffIds: ["u-divya", "u-rahul", "u-priya"], teamLeadId: "u-divya",
    location: "Kannur Road, Kozhikode",
    startDate: d(-520), expectedEndDate: d(-60), actualEndDate: d(-60), projectValue: 25000000, feeAgreed: 1250000,
    feeStructure: "lump_sum", fileRequestWindowDays: 14, chatEnabled: false,
    createdAt: iso(-530), updatedAt: iso(-60),
  },
];

// ─── CDA Tasks ─────────────────────────────────────────────────────────────────

export const CDA_TASKS: Task[] = [
  // Rameshan Villa — Design Development
  {
    id: "t-rv-001", firmId: CDA, projectId: "p-rameshan-villa", stageId: RV_S[2].id,
    title: "Finalise floor plan changes per client feedback",
    description: "Client requested master bedroom shifted north and a separate study room.",
    assigneeId: "u-priya", assignerId: "u-divya", status: "in_progress", priority: "high",
    dueDate: d(2),
    subtasks: [
      { id: "st-rv1", title: "Revise GF plan", completed: true, createdById: "u-divya", assignedToId: "u-priya", createdAt: iso(-5) },
      { id: "st-rv2", title: "Revise FF plan", completed: false, createdById: "u-divya", assignedToId: "u-priya", createdAt: iso(-5) },
    ],
    isBlocked: false, createdAt: iso(-7), updatedAt: iso(-1),
  },
  {
    id: "t-rv-002", firmId: CDA, projectId: "p-rameshan-villa", stageId: RV_S[2].id,
    title: "Prepare material specification document",
    assigneeId: "u-divya", assignerId: "u-arjun", status: "todo", priority: "medium",
    dueDate: d(5), subtasks: [], isBlocked: false, createdAt: iso(-3), updatedAt: iso(-3),
  },
  {
    id: "t-rv-003", firmId: CDA, projectId: "p-rameshan-villa", stageId: RV_S[2].id,
    title: "3D visualisation — living area and master suite",
    assigneeId: "u-santhosh", assignerId: "u-divya", status: "todo", priority: "medium",
    dueDate: d(7), subtasks: [], isBlocked: false, createdAt: iso(-3), updatedAt: iso(-3),
  },
  {
    id: "t-rv-004", firmId: CDA, projectId: "p-rameshan-villa", stageId: RV_S[2].id,
    title: "Integrate structural engineer input on slab thickness",
    assigneeId: "u-vishnu", assignerId: "u-divya", status: "todo", priority: "high",
    dueDate: d(0), subtasks: [], isBlocked: false, createdAt: iso(-2), updatedAt: iso(-2),
  },
  {
    id: "t-rv-005", firmId: CDA, projectId: "p-rameshan-villa", stageId: RV_S[2].id,
    title: "Update site boundary drawing — correction per survey",
    assigneeId: "u-priya", assignerId: "u-divya", status: "review", priority: "low",
    dueDate: d(-3), subtasks: [], isBlocked: false, createdAt: iso(-10), updatedAt: iso(-2),
  },
  // Suma George — Working Drawings
  {
    id: "t-sg-001", firmId: CDA, projectId: "p-suma-residence", stageId: SG_S[3].id,
    title: "Complete structural drawing set",
    assigneeId: "u-rahul", assignerId: "u-arjun", status: "in_progress", priority: "urgent",
    dueDate: d(0),
    subtasks: [
      { id: "st-sg1", title: "Column layout plan", completed: true, createdById: "u-rahul", assignedToId: "u-rahul", createdAt: iso(-10) },
      { id: "st-sg2", title: "Beam layout plan", completed: true, createdById: "u-rahul", assignedToId: "u-rahul", createdAt: iso(-10) },
      { id: "st-sg3", title: "Foundation details", completed: false, createdById: "u-rahul", assignedToId: "u-rahul", createdAt: iso(-10) },
      { id: "st-sg4", title: "Staircase structural detail", completed: false, createdById: "u-rahul", assignedToId: "u-rahul", createdAt: iso(-10) },
    ],
    isBlocked: false, createdAt: iso(-15), updatedAt: iso(-1),
  },
  {
    id: "t-sg-002", firmId: CDA, projectId: "p-suma-residence", stageId: SG_S[3].id,
    title: "Electrical layout — all floors",
    assigneeId: "u-amal", assignerId: "u-rahul", status: "todo", priority: "high",
    dueDate: d(4), subtasks: [], isBlocked: false, createdAt: iso(-5), updatedAt: iso(-5),
  },
  {
    id: "t-sg-003", firmId: CDA, projectId: "p-suma-residence", stageId: SG_S[3].id,
    title: "Plumbing schematic drawing",
    assigneeId: "u-nithya", assignerId: "u-rahul", status: "todo", priority: "medium",
    dueDate: d(6), subtasks: [], isBlocked: false, createdAt: iso(-5), updatedAt: iso(-5),
  },
  {
    id: "t-sg-004", firmId: CDA, projectId: "p-suma-residence", stageId: SG_S[3].id,
    title: "Door and window schedule",
    assigneeId: "u-nithya", assignerId: "u-rahul", status: "review", priority: "medium",
    dueDate: d(-1), subtasks: [], isBlocked: false, createdAt: iso(-12), updatedAt: iso(-2),
  },
  {
    id: "t-sg-005", firmId: CDA, projectId: "p-suma-residence", stageId: SG_S[3].id,
    title: "Site supervision visit — foundation check",
    assigneeId: "u-joseph", assignerId: "u-rahul", status: "done", priority: "high",
    dueDate: d(-5), subtasks: [], isBlocked: false, createdAt: iso(-20), updatedAt: iso(-5),
  },
  // Beach Club — Construction Supervision
  {
    id: "t-bc-001", firmId: CDA, projectId: "p-beach-club", stageId: BC_S[5].id,
    title: "Weekly site visit — structural progress check",
    assigneeId: "u-joseph", assignerId: "u-divya", status: "todo", priority: "high",
    dueDate: d(1), subtasks: [], isBlocked: false, createdAt: iso(-3), updatedAt: iso(-3),
  },
  {
    id: "t-bc-002", firmId: CDA, projectId: "p-beach-club", stageId: BC_S[5].id,
    title: "Respond to RFI-003 — tile specification",
    assigneeId: "u-divya", assignerId: "u-arjun", status: "todo", priority: "urgent",
    dueDate: d(-2), subtasks: [], isBlocked: false, createdAt: iso(-8), updatedAt: iso(-8),
  },
  {
    id: "t-bc-003", firmId: CDA, projectId: "p-beach-club", stageId: BC_S[5].id,
    title: "Review punch list items 1–5",
    assigneeId: "u-amal", assignerId: "u-divya", status: "in_progress", priority: "medium",
    dueDate: d(3), subtasks: [], isBlocked: false, createdAt: iso(-4), updatedAt: iso(-1),
  },
  // Krishnamoorthi — Schematic
  {
    id: "t-kc-001", firmId: CDA, projectId: "p-krish-commercial", stageId: KC_S[1].id,
    title: "Prepare client presentation deck for schematic approval",
    assigneeId: "u-santhosh", assignerId: "u-divya", status: "done", priority: "high",
    dueDate: d(-6), subtasks: [], isBlocked: false, createdAt: iso(-14), updatedAt: iso(-6),
  },
  {
    id: "t-kc-002", firmId: CDA, projectId: "p-krish-commercial", stageId: KC_S[1].id,
    title: "Update parking layout per local authority norms",
    assigneeId: "u-lekha", assignerId: "u-divya", status: "todo", priority: "medium",
    dueDate: d(5), subtasks: [], isBlocked: false, createdAt: iso(-2), updatedAt: iso(-2),
  },
  // Fathima Cottage — Concept
  {
    id: "t-fc-001", firmId: CDA, projectId: "p-fathima-cottage", stageId: FC_S[0].id,
    title: "Site measurement and survey report",
    assigneeId: "u-priya", assignerId: "u-rahul", status: "done", priority: "high",
    dueDate: d(-8), subtasks: [], isBlocked: false, createdAt: iso(-10), updatedAt: iso(-8),
  },
  {
    id: "t-fc-002", firmId: CDA, projectId: "p-fathima-cottage", stageId: FC_S[0].id,
    title: "Prepare 3 concept scheme options",
    assigneeId: "u-rahul", assignerId: "u-arjun", status: "in_progress", priority: "medium",
    dueDate: d(4), subtasks: [], isBlocked: false, createdAt: iso(-5), updatedAt: iso(-1),
  },
  {
    id: "t-fc-003", firmId: CDA, projectId: "p-fathima-cottage", stageId: FC_S[0].id,
    title: "Brief review meeting with client",
    assigneeId: "u-rahul", assignerId: "u-rahul", status: "todo", priority: "low",
    dueDate: d(0), subtasks: [], isBlocked: false, createdAt: iso(-3), updatedAt: iso(-3),
  },
];

// ─── CDA Time Logs ─────────────────────────────────────────────────────────────

export const CDA_TIME_LOGS: TimeLog[] = [
  {
    id: "tl-001", firmId: CDA, userId: "u-divya", projectId: "p-rameshan-villa",
    stageId: RV_S[2].id, phase: "Design Development",
    startTime: iso(-1), endTime: iso(-1), durationMinutes: 180,
    date: d(-1), isEdited: false, createdAt: iso(-1),
  },
  {
    id: "tl-002", firmId: CDA, userId: "u-priya", projectId: "p-rameshan-villa",
    stageId: RV_S[2].id, phase: "Design Development",
    startTime: iso(-1), endTime: iso(-1), durationMinutes: 240,
    date: d(-1), isEdited: false, createdAt: iso(-1),
  },
  {
    id: "tl-003", firmId: CDA, userId: "u-rahul", projectId: "p-suma-residence",
    stageId: SG_S[3].id, phase: "Working Drawings",
    startTime: iso(-2), endTime: iso(-2), durationMinutes: 300,
    date: d(-2), isEdited: false, createdAt: iso(-2),
  },
  {
    id: "tl-004", firmId: CDA, userId: "u-joseph", projectId: "p-beach-club",
    stageId: BC_S[5].id, phase: "Construction Supervision",
    startTime: iso(-3), endTime: iso(-3), durationMinutes: 480,
    date: d(-3), isEdited: false, createdAt: iso(-3),
  },
];

// ─── CDA Leaves ─────────────────────────────────────────────────────────────

export const CDA_LEAVES: LeaveRequest[] = [
  {
    id: "lr-001", firmId: CDA, userId: "u-priya", userName: "Priya Suresh",
    startDate: d(5), endDate: d(7), days: 3, reason: "Family function — Onam preparations",
    status: "pending", createdAt: iso(-2),
  },
  {
    id: "lr-002", firmId: CDA, userId: "u-amal", userName: "Amal Babu",
    startDate: d(-10), endDate: d(-8), days: 3, reason: "Medical leave",
    status: "approved", reviewedById: "u-arjun", reviewedAt: iso(-12), createdAt: iso(-13),
  },
  {
    id: "lr-003", firmId: CDA, userId: "u-vishnu", userName: "Vishnu Varma",
    startDate: d(-30), endDate: d(-28), days: 3, reason: "Personal",
    status: "rejected", reviewedById: "u-arjun", reviewedAt: iso(-32),
    rejectionNote: "Project deadline clash", createdAt: iso(-33),
  },
];

// ─── CDA Files ─────────────────────────────────────────────────────────────────

const mkRev = (n: number, by: string, daysAgo: number, sharedClient: boolean): FileRevision => ({
  id: `rev-${n}-${by}-${daysAgo}`,
  revisionNumber: n,
  uploadedById: by,
  uploadedAt: iso(-daysAgo),
  fileSizeKb: 1800 + n * 200,
  sharedWithClient: sharedClient,
  sharedWithContractorIds: [],
});

export const CDA_FILES: ProjectFile[] = [
  {
    id: "f-rv-001", firmId: CDA, projectId: "p-rameshan-villa", stageId: RV_S[2].id,
    drawingNumber: "A-001", name: "Ground Floor Plan — Rev B", category: "architectural",
    status: "informational", currentRevision: 2,
    revisions: [mkRev(1, "u-vishnu", 20, false), mkRev(2, "u-priya", 5, true)],
    approvalStatus: "pending", createdAt: iso(-20), updatedAt: iso(-5),
  },
  {
    id: "f-rv-002", firmId: CDA, projectId: "p-rameshan-villa", stageId: RV_S[2].id,
    drawingNumber: "A-002", name: "First Floor Plan", category: "architectural",
    status: "informational", currentRevision: 1,
    revisions: [mkRev(1, "u-priya", 15, true)],
    approvalStatus: "pending", createdAt: iso(-15), updatedAt: iso(-15),
  },
  {
    id: "f-sg-001", firmId: CDA, projectId: "p-suma-residence", stageId: SG_S[3].id,
    drawingNumber: "S-001", name: "Structural Column Layout", category: "structural",
    status: "final", currentRevision: 3,
    revisions: [mkRev(1, "u-rahul", 40, false), mkRev(2, "u-rahul", 20, false), mkRev(3, "u-rahul", 5, true)],
    approvalStatus: "approved", approvedById: "u-arjun", approvedAt: iso(-4),
    createdAt: iso(-40), updatedAt: iso(-5),
  },
  {
    id: "f-bc-001", firmId: CDA, projectId: "p-beach-club", stageId: BC_S[5].id,
    drawingNumber: "A-015", name: "Interior Finishes Plan — Level 1", category: "interior",
    status: "contractor_view", currentRevision: 2,
    revisions: [mkRev(1, "u-sreeja", 30, false), mkRev(2, "u-sreeja", 10, false)],
    approvalStatus: "approved", approvedById: "u-divya", approvedAt: iso(-9),
    createdAt: iso(-30), updatedAt: iso(-10),
  },
];

// ─── CDA File Requests ─────────────────────────────────────────────────────────

export const CDA_FILE_REQUESTS: FileRequest[] = [
  {
    id: "fr-001", firmId: CDA, projectId: "p-rameshan-villa",
    requestedById: "cl-rameshan", requesterType: "client", requesterName: "Rameshan Pillai",
    description: "Please share the elevation drawings for review",
    status: "pending", responseDueDate: d(7), createdAt: iso(-3),
  },
  {
    id: "fr-002", firmId: CDA, projectId: "p-beach-club",
    requestedById: "con-unity", requesterType: "contractor", requesterName: "Unity Constructions",
    description: "Need updated tile specification drawing for Level 1 restaurant area",
    linkedFileId: "f-bc-001",
    status: "pending", responseDueDate: d(5), createdAt: iso(-4),
  },
];

// ─── CDA Variation Orders ────────────────────────────────────────────────────

export const CDA_VOS: VariationOrder[] = [
  {
    id: "vo-001", firmId: CDA, projectId: "p-beach-club", voNumber: "VO-2025-001",
    title: "Additional outdoor seating area — 200 sqm extension",
    description: "Client requested 200 sqm outdoor canopy seating area not in original scope.",
    raisedByUserId: "u-divya", affectedStageId: BC_S[5].id,
    status: "pending_client", timelineImpactDays: 30, feeImpactAmount: 180000,
    clientApprovalStatus: "pending",
    createdAt: iso(-10), updatedAt: iso(-10),
  },
];

// ─── CDA RFIs ─────────────────────────────────────────────────────────────────

export const CDA_RFIS: RFI[] = [
  {
    id: "rfi-001", firmId: CDA, projectId: "p-beach-club", rfiNumber: "RFI-001",
    title: "Clarification on column footing depth — north elevation",
    description: "Structural drawing shows 1.5m footing depth but soil report indicates 1.8m required.",
    raisedById: "con-unity", raiserType: "contractor", raiserName: "Unity Constructions",
    linkedDrawingId: "f-sg-001", linkedDrawingNumber: "S-001",
    status: "responded", priority: "high",
    respondedById: "u-rahul",
    responseText: "Use 1.8m as per soil report. Structural drawings will be revised.",
    respondedAt: iso(-5), createdAt: iso(-12),
  },
  {
    id: "rfi-002", firmId: CDA, projectId: "p-suma-residence", rfiNumber: "RFI-001",
    title: "Window sill height on east facade — conflict with AC unit",
    description: "Proposed 900mm sill height conflicts with split AC outdoor unit on east wall.",
    raisedById: "con-unity", raiserType: "contractor", raiserName: "Unity Constructions",
    status: "open", priority: "medium", responseRequiredBy: d(-1), createdAt: iso(-8),
  },
  {
    id: "rfi-003", firmId: CDA, projectId: "p-beach-club", rfiNumber: "RFI-003",
    title: "Tile specification for outdoor terrace — anti-slip rating",
    description: "Drawing A-015 specifies Kajaria KT-760 but this is not anti-slip rated.",
    raisedById: "con-unity", raiserType: "contractor", raiserName: "Unity Constructions",
    status: "open", priority: "urgent", responseRequiredBy: d(-2), createdAt: iso(-5),
  },
];

// ─── CDA Punch List ────────────────────────────────────────────────────────────

export const CDA_PUNCHLIST: PunchListItem[] = [
  {
    id: "pl-001", firmId: CDA, projectId: "p-beach-club", itemNumber: "PL-001",
    description: "Hairline crack at north corner column — requires grouting",
    location: "Level 1, North Column C4",
    assignedContractorId: "con-unity", raisedById: "u-joseph",
    dueDate: d(7), status: "open", createdAt: iso(-10),
  },
  {
    id: "pl-002", firmId: CDA, projectId: "p-beach-club", itemNumber: "PL-002",
    description: "Skirting tiles misaligned — bathroom 1B, 2B",
    location: "Level 1, Bathrooms 1B and 2B",
    assignedContractorId: "con-unity", raisedById: "u-amal",
    dueDate: d(5), status: "open", createdAt: iso(-8),
  },
  {
    id: "pl-003", firmId: CDA, projectId: "p-beach-club", itemNumber: "PL-003",
    description: "Electrical switchboard cover missing — pantry area",
    location: "Level 1, Pantry",
    assignedContractorId: "con-jayalekha", raisedById: "u-joseph",
    dueDate: d(3), status: "resolved_by_contractor",
    contractorResolvedAt: iso(-2), contractorNote: "Cover installed. Please inspect.",
    createdAt: iso(-12),
  },
  {
    id: "pl-004", firmId: CDA, projectId: "p-beach-club", itemNumber: "PL-004",
    description: "Weatherproofing sealant missing at roof parapet joint",
    location: "Roof terrace, south parapet",
    assignedContractorId: "con-unity", raisedById: "u-divya",
    dueDate: d(10), status: "open", createdAt: iso(-5),
  },
  {
    id: "pl-005", firmId: CDA, projectId: "p-beach-club", itemNumber: "PL-005",
    description: "Landscape boulders not matching approved sample",
    location: "Outdoor garden area",
    assignedContractorId: "con-greenscape", raisedById: "u-amal",
    dueDate: d(14), status: "open", createdAt: iso(-3),
  },
];

// ─── CDA Site Reports ──────────────────────────────────────────────────────────

export const CDA_SITE_REPORTS: DailySiteReport[] = [
  {
    id: "sr-001", firmId: CDA, projectId: "p-beach-club", date: d(-1),
    reportedById: "u-joseph", weather: "Partly cloudy, 32°C",
    workCompleted: "Tile laying on Level 1 east wing done. Started grouting in bathrooms.",
    mistakesOrIssues: "RFI-003 tile issue — awaiting architect response. Work paused on terrace.",
    materialsReceived: "200 bags OPC cement, 50 boxes Kajaria tiles",
    workersPresent: 18, createdAt: iso(-1),
  },
  {
    id: "sr-002", firmId: CDA, projectId: "p-beach-club", date: d(-2),
    reportedById: "u-joseph", weather: "Sunny, 35°C",
    workCompleted: "Electrical conduit installation completed on Level 1. MEP rough-in 60% done.",
    workersPresent: 22, createdAt: iso(-2),
  },
  {
    id: "sr-003", firmId: CDA, projectId: "p-beach-club", date: d(-3),
    reportedById: "u-joseph", weather: "Rain — work stopped at 3 PM",
    workCompleted: "Concrete pour for Level 2 slab completed before rain. Curing started.",
    mistakesOrIssues: "Light rain delay — 2 hours lost. Night shift cancelled.",
    workersPresent: 25, createdAt: iso(-3),
  },
  {
    id: "sr-004", firmId: CDA, projectId: "p-suma-residence", date: d(-2),
    reportedById: "u-joseph", weather: "Clear, 33°C",
    workCompleted: "Foundation footing concrete poured. Reinforcement inspection done.",
    workersPresent: 14, createdAt: iso(-2),
  },
  {
    id: "sr-005", firmId: CDA, projectId: "p-suma-residence", date: d(-4),
    reportedById: "u-joseph", weather: "Overcast",
    workCompleted: "Excavation for foundation completed. Anti-termite treatment applied.",
    workersPresent: 12, createdAt: iso(-4),
  },
];

// ─── CDA Meetings ──────────────────────────────────────────────────────────────

export const CDA_MEETINGS: Meeting[] = [
  {
    id: "mtg-001", firmId: CDA, projectId: "p-rameshan-villa",
    title: "Design Development Review — Rameshan Villa",
    date: d(2), time: "10:00", durationMinutes: 90,
    mode: "in_person", location: "Client Office, Vellimadukunnu",
    attendeeIds: ["u-divya", "u-priya"], clientAttending: true, contractorIds: [],
    remarks: "Review revised floor plans and material palette",
    createdById: "u-divya", createdAt: iso(-5),
  },
  {
    id: "mtg-002", firmId: CDA, projectId: "p-beach-club",
    title: "Site Progress Meeting — Week 42",
    date: d(1), time: "09:00", durationMinutes: 60,
    mode: "site_visit", location: "Kozhikode Beach Club site",
    attendeeIds: ["u-divya", "u-joseph"], clientAttending: false, contractorIds: ["con-unity"],
    remarks: "Weekly coordination with contractor",
    createdById: "u-divya", createdAt: iso(-4),
  },
  {
    id: "mtg-003", firmId: CDA, projectId: "p-krish-commercial",
    title: "Schematic Approval Presentation — Krishnamoorthi Commercial",
    date: d(5), time: "14:00", durationMinutes: 120,
    mode: "google_meet", meetingLink: "https://meet.google.com/abc-defg-hij",
    attendeeIds: ["u-divya", "u-santhosh", "u-lekha"], clientAttending: true, contractorIds: [],
    remarks: "Present 3D renders. Awaiting client approval on Schematic.",
    createdById: "u-arjun", createdAt: iso(-7),
  },
];

// ─── CDA Finance ───────────────────────────────────────────────────────────────

const mkLI = (desc: string, amount: number, isAdHoc: boolean, milestoneId?: string): InvoiceLineItem => ({
  id: `li-${desc.slice(0, 5).replace(/\s+/g, "")}-${amount}`,
  description: desc,
  amount,
  gstRate: 18,
  gstAmount: Math.round(amount * 0.18),
  isAdHoc,
  milestoneStageId: milestoneId,
});

export const CDA_EXPENSES: Expense[] = [
  {
    id: "exp-001", firmId: CDA, userId: "u-joseph", projectId: "p-beach-club",
    category: "site_visit", amount: 850, description: "Fuel and toll — site visit Kozhikode Beach Club",
    date: d(-1), status: "approved", approvedById: "u-arjun", approvedAt: iso(-1), createdAt: iso(-1),
  },
  {
    id: "exp-002", firmId: CDA, userId: "u-divya", projectId: "p-rameshan-villa",
    category: "client_meeting", amount: 2400, description: "Client dinner — design presentation",
    date: d(-3), status: "pending", createdAt: iso(-3),
  },
  {
    id: "exp-003", firmId: CDA, userId: "u-vishnu", projectId: "p-rameshan-villa",
    category: "printing", amount: 1200, description: "A0 prints — floor plan set for client",
    date: d(-5), status: "approved", approvedById: "u-arjun", approvedAt: iso(-4), createdAt: iso(-5),
  },
];

export const CDA_INVOICES: Invoice[] = [
  {
    id: "inv-001", firmId: CDA, projectId: "p-rameshan-villa", clientId: "cl-rameshan",
    invoiceNumber: "INV-2025-001",
    lineItems: [
      mkLI("Stage 1 — Concept & Brief", 102000, false, RV_S[0].id),
      mkLI("Stage 2 — Schematic Design", 136000, false, RV_S[1].id),
    ],
    subtotal: 238000, gstTotal: 42840, total: 280840,
    status: "paid", issuedDate: d(-75), dueDate: d(-60),
    paidDate: d(-55), paidAmount: 280840,
    createdById: "u-megha", createdAt: iso(-75),
  },
  {
    id: "inv-002", firmId: CDA, projectId: "p-suma-residence", clientId: "cl-suma",
    invoiceNumber: "INV-2025-002",
    lineItems: [mkLI("Stage 4 — Working Drawings (50% advance)", 148800, false, SG_S[3].id)],
    subtotal: 148800, gstTotal: 26784, total: 175584,
    status: "sent", issuedDate: d(-10), dueDate: d(20),
    createdById: "u-megha", createdAt: iso(-10),
  },
  {
    id: "inv-003", firmId: CDA, projectId: "p-beach-club", clientId: "cl-krishnamoorthi",
    invoiceNumber: "INV-2025-003",
    lineItems: [
      mkLI("Stage 6 — Construction Supervision (2nd instalment)", 144000, false, BC_S[5].id),
      mkLI("Additional site visits beyond contractual limit", 24000, true),
    ],
    subtotal: 168000, gstTotal: 30240, total: 198240,
    status: "overdue", issuedDate: d(-35), dueDate: d(-5),
    createdById: "u-megha", createdAt: iso(-35),
  },
];

export const CDA_SALARIES: SalaryRecord[] = [
  { id: "sal-arjun-1", firmId: CDA, userId: "u-arjun", month: "2025-05", amount: 180000, status: "paid", paidDate: d(-60), paidById: "u-megha" },
  { id: "sal-arjun-2", firmId: CDA, userId: "u-arjun", month: "2025-06", amount: 180000, status: "paid", paidDate: d(-30), paidById: "u-megha" },
  { id: "sal-arjun-3", firmId: CDA, userId: "u-arjun", month: "2025-07", amount: 180000, status: "pending" },
  { id: "sal-divya-1", firmId: CDA, userId: "u-divya", month: "2025-05", amount: 120000, status: "paid", paidDate: d(-60), paidById: "u-megha" },
  { id: "sal-divya-2", firmId: CDA, userId: "u-divya", month: "2025-06", amount: 120000, status: "paid", paidDate: d(-30), paidById: "u-megha" },
  { id: "sal-divya-3", firmId: CDA, userId: "u-divya", month: "2025-07", amount: 120000, status: "pending" },
  { id: "sal-rahul-1", firmId: CDA, userId: "u-rahul", month: "2025-05", amount: 95000, status: "paid", paidDate: d(-60), paidById: "u-megha" },
  { id: "sal-rahul-2", firmId: CDA, userId: "u-rahul", month: "2025-06", amount: 95000, status: "paid", paidDate: d(-30), paidById: "u-megha" },
  { id: "sal-rahul-3", firmId: CDA, userId: "u-rahul", month: "2025-07", amount: 95000, status: "pending" },
];

// ─── CDA CRM ───────────────────────────────────────────────────────────────────

const mkNote = (content: string, createdById: string, daysAgo: number): LeadNote => ({
  id: `ln-${createdById}-${daysAgo}`,
  content,
  createdById,
  createdAt: iso(-daysAgo),
});

export const CDA_LEADS: Lead[] = [
  {
    id: "lead-001", firmId: CDA, name: "Hameed Ibrahim", company: "Ibrahim Exports",
    phone: "+91 98470 80001", email: "hameed@ibrahimexports.in",
    projectType: "Commercial Warehouse", estimatedValue: 18000000,
    location: "Feroke, Kozhikode", source: "referral", stage: "proposal_sent",
    assignedToId: "u-arjun",
    notes: [
      mkNote("Called — interested in a 5000 sqft warehouse. Budget ₹1.8Cr.", "u-arjun", 15),
      mkNote("Site visit done. Sent preliminary scope document.", "u-arjun", 8),
    ],
    followUpDate: d(3), createdAt: iso(-15), updatedAt: iso(-8),
  },
  {
    id: "lead-002", firmId: CDA, name: "Anjali Nambiar",
    phone: "+91 94470 80002", email: "anjali.n@gmail.com",
    projectType: "Residential Villa", estimatedValue: 7500000,
    location: "Thondayad, Kozhikode", source: "website", stage: "contacted",
    assignedToId: "u-divya",
    notes: [mkNote("Enquiry via website. Called back — 3000 sqft family residence.", "u-divya", 5)],
    followUpDate: d(1), createdAt: iso(-5), updatedAt: iso(-5),
  },
  {
    id: "lead-003", firmId: CDA, name: "Church of South India, Kozhikode",
    phone: "+91 97890 80003", email: "diocese.kzd@csi.in",
    projectType: "Institutional — Community Hall", estimatedValue: 12000000,
    location: "Palayam, Kozhikode", source: "referral", stage: "negotiation",
    assignedToId: "u-arjun",
    notes: [
      mkNote("Met diocesan council. 800-seat community hall needed.", "u-arjun", 25),
      mkNote("Submitted fee proposal. Negotiating 4% vs 3.5% of project value.", "u-arjun", 10),
    ],
    followUpDate: d(7), createdAt: iso(-25), updatedAt: iso(-10),
  },
  {
    id: "lead-004", firmId: CDA, name: "Shine Thomas",
    phone: "+91 98950 80004", email: "shine.thomas@gmail.com",
    projectType: "Residential Extension", estimatedValue: 2000000,
    location: "Puthiyara, Kozhikode", source: "walk_in", stage: "won",
    assignedToId: "u-rahul",
    convertedProjectId: "p-fathima-cottage",
    notes: [mkNote("Walk-in enquiry. Budget fit. Converted to project.", "u-rahul", 12)],
    createdAt: iso(-20), updatedAt: iso(-12),
  },
  {
    id: "lead-005", firmId: CDA, name: "Kerala Tourism Development Corporation",
    phone: "+91 471 2321132", email: "projects@keralatourism.gov.in",
    projectType: "Heritage Hotel Renovation", estimatedValue: 60000000,
    location: "Beypore, Kozhikode", source: "cold_call", stage: "new",
    assignedToId: "u-arjun", notes: [],
    createdAt: iso(-2), updatedAt: iso(-2),
  },
  {
    id: "lead-006", firmId: CDA, name: "Rajesh Mohan",
    phone: "+91 96330 80006", email: "rajesh.m@gmail.com",
    projectType: "Residential", estimatedValue: 4500000,
    location: "Mavoor Road, Kozhikode", source: "social_media", stage: "lost",
    lostReason: "Client went with a cheaper contractor directly",
    notes: [
      mkNote("Instagram DM — interested in interior design + build.", "u-divya", 30),
      mkNote("Lost — client not ready for professional fees.", "u-divya", 20),
    ],
    createdAt: iso(-30), updatedAt: iso(-20),
  },
];

// ─── CDA Chat ─────────────────────────────────────────────────────────────────

export const CDA_CHAT: ChatMessage[] = [
  {
    id: "chat-001", firmId: CDA, projectId: "p-rameshan-villa",
    senderId: "u-divya", senderName: "Divya Menon", senderType: "staff",
    content: "Mr. Rameshan, we've uploaded the revised GF plan. Could you review and confirm before Thursday?",
    mentions: [{ type: "file", id: "f-rv-001", label: "A-001 Ground Floor Plan" }],
    readBy: ["u-divya", "u-arjun"], createdAt: iso(-3),
  },
  {
    id: "chat-002", firmId: CDA, projectId: "p-rameshan-villa",
    senderId: "cl-rameshan", senderName: "Rameshan Pillai", senderType: "client",
    content: "Saw the plan. The study room shift looks good. Can we extend the verandah by another 2 feet?",
    mentions: [], readBy: ["cl-rameshan", "u-divya"], createdAt: iso(-2),
  },
  {
    id: "chat-003", firmId: CDA, projectId: "p-rameshan-villa",
    senderId: "u-divya", senderName: "Divya Menon", senderType: "staff",
    content: "Of course — I'll incorporate that into Rev C. Will share by tomorrow.",
    mentions: [], readBy: ["u-divya", "u-arjun"], createdAt: iso(-2),
  },
  {
    id: "chat-004", firmId: CDA, projectId: "p-beach-club",
    senderId: "u-joseph", senderName: "Joseph Mathew", senderType: "staff",
    content: "Site visit done. PL-003 (switchboard cover) now resolved by Jayalekha.",
    mentions: [], readBy: ["u-joseph", "u-divya", "u-arjun"], createdAt: iso(-2),
  },
  {
    id: "chat-005", firmId: CDA, projectId: "p-beach-club",
    senderId: "u-divya", senderName: "Divya Menon", senderType: "staff",
    content: "Good. Still waiting on RFI-003 tile response. @Arjun — can you confirm the anti-slip alternative?",
    mentions: [{ type: "user", id: "u-arjun", label: "Arjun Nair" }],
    readBy: ["u-divya"], createdAt: iso(-1),
  },
];

// ─── Forma Studio (minimal) ────────────────────────────────────────────────────

export const FORMA_USERS: User[] = [
  {
    id: "u-f-anand", firmId: FORMA, name: "Anand Pillai", email: "anand@formastudio.in",
    phone: "+91 98450 90001", role: "admin", designation: "Principal Architect",
    avatarInitials: "AP", avatarColor: "#e55230",
    costRatePerHour: 2200, joinedAt: "2024-09-01", status: "active",
  },
  {
    id: "u-f-kavitha", firmId: FORMA, name: "Kavitha Raj", email: "kavitha@formastudio.in",
    phone: "+91 94470 90002", role: "team_lead", designation: "Senior Architect",
    avatarInitials: "KR", avatarColor: "#5b8dd9",
    costRatePerHour: 1500, joinedAt: "2024-09-10", status: "active",
  },
  {
    id: "u-f-manu", firmId: FORMA, name: "Manu George", email: "manu@formastudio.in",
    phone: "+91 97890 90003", role: "staff", designation: "Junior Architect",
    avatarInitials: "MG", avatarColor: "#52a45e",
    costRatePerHour: 800, joinedAt: "2025-02-01", status: "active",
  },
];

export const FORMA_CLIENTS: Client[] = [
  {
    id: "cl-f-biju", firmId: FORMA, name: "Biju Varghese",
    phone: "+91 98470 90010", email: "biju.varghese@gmail.com",
    address: "Edappally, Kochi", portalEnabled: true, createdAt: "2024-10-01",
  },
  {
    id: "cl-f-asha", firmId: FORMA, name: "Asha Nair",
    phone: "+91 94470 90011", email: "asha.nair@gmail.com",
    address: "Kakkanad, Kochi", portalEnabled: false, createdAt: "2025-01-15",
  },
];

const F_TS = CDA_TEMPLATE_STAGES;
const FP1_S = F_TS.map((ts, i) =>
  makeStage(`fp1-s${i + 1}`, ts,
    i === 0 ? { status: "completed", actualEndDate: d(-30), clientApprovalStatus: "approved", clientApprovedAt: d(-25) } :
    i === 1 ? { status: "in_progress", startDate: d(-25) } : {}
  )
);
const FP2_S = F_TS.map((ts, i) =>
  makeStage(`fp2-s${i + 1}`, ts,
    i === 0 ? { status: "in_progress", startDate: d(-5) } : {}
  )
);

export const FORMA_PROJECTS: Project[] = [
  {
    id: "p-f-biju-villa", firmId: FORMA, name: "Biju Villa — Edappally",
    clientId: "cl-f-biju", clientName: "Biju Varghese",
    contractorIds: [], status: "active", stages: FP1_S, currentStageId: FP1_S[1].id,
    staffIds: ["u-f-kavitha", "u-f-manu"], teamLeadId: "u-f-kavitha",
    location: "Edappally, Kochi",
    startDate: d(-35), expectedEndDate: d(220), projectValue: 6000000, feeAgreed: 480000,
    feeStructure: "per_stage", fileRequestWindowDays: 10, chatEnabled: false,
    createdAt: iso(-40), updatedAt: iso(-2),
  },
  {
    id: "p-f-asha-home", firmId: FORMA, name: "Asha Residence — Kakkanad",
    clientId: "cl-f-asha", clientName: "Asha Nair",
    contractorIds: [], status: "active", stages: FP2_S, currentStageId: FP2_S[0].id,
    staffIds: ["u-f-manu"], teamLeadId: "u-f-kavitha",
    location: "Kakkanad, Kochi",
    startDate: d(-5), expectedEndDate: d(270), projectValue: 4200000, feeAgreed: 336000,
    feeStructure: "lump_sum", fileRequestWindowDays: 10, chatEnabled: false,
    createdAt: iso(-7), updatedAt: iso(-1),
  },
];

export const FORMA_TASKS: Task[] = [
  {
    id: "t-f-001", firmId: FORMA, projectId: "p-f-biju-villa", stageId: FP1_S[1].id,
    title: "Prepare schematic floor plans",
    assigneeId: "u-f-kavitha", assignerId: "u-f-anand", status: "in_progress", priority: "high",
    dueDate: d(4), subtasks: [], isBlocked: false, createdAt: iso(-5), updatedAt: iso(-1),
  },
  {
    id: "t-f-002", firmId: FORMA, projectId: "p-f-asha-home", stageId: FP2_S[0].id,
    title: "Site measurement and brief documentation",
    assigneeId: "u-f-manu", assignerId: "u-f-kavitha", status: "todo", priority: "medium",
    dueDate: d(2), subtasks: [], isBlocked: false, createdAt: iso(-2), updatedAt: iso(-2),
  },
];

// ─── SEED FUNCTION ─────────────────────────────────────────────────────────────

export function seedAllStores(): void {
  const { firms } = useFirmStore.getState();
  if (firms.length > 0) return; // idempotent

  // Directly inject state to bypass auto-numbering and side-effect actions.
  // This is correct for seeding — stores still work normally after this.

  useFirmStore.setState((s) => ({
    firms: [...s.firms, ...FIRMS],
    users: [...s.users, ...CDA_USERS, ...FORMA_USERS],
    clients: [...s.clients, ...CDA_CLIENTS, ...FORMA_CLIENTS],
    contractors: [...s.contractors, ...CDA_CONTRACTORS],
    templates: [...s.templates, CDA_TEMPLATE],
  }));

  useProjectStore.setState((s) => ({
    projects: [...s.projects, ...CDA_PROJECTS, ...FORMA_PROJECTS],
  }));

  useTaskStore.setState((s) => ({
    tasks: [...s.tasks, ...CDA_TASKS, ...FORMA_TASKS],
  }));

  useTimeStore.setState((s) => ({
    timeLogs: [...s.timeLogs, ...CDA_TIME_LOGS],
  }));

  useLeaveStore.setState((s) => ({
    requests: [...s.requests, ...CDA_LEAVES],
  }));

  useFileStore.setState((s) => ({
    files: [...s.files, ...CDA_FILES],
  }));

  useRequestStore.setState((s) => ({
    fileRequests: [...s.fileRequests, ...CDA_FILE_REQUESTS],
  }));

  useVoStore.setState((s) => ({
    variationOrders: [...s.variationOrders, ...CDA_VOS],
  }));

  useRfiStore.setState((s) => ({
    rfis: [...s.rfis, ...CDA_RFIS],
  }));

  usePunchlistStore.setState((s) => ({
    items: [...s.items, ...CDA_PUNCHLIST],
  }));

  useSitereportStore.setState((s) => ({
    reports: [...s.reports, ...CDA_SITE_REPORTS],
  }));

  useMeetingStore.setState((s) => ({
    meetings: [...s.meetings, ...CDA_MEETINGS],
  }));

  useFinanceStore.setState((s) => ({
    expenses: [...s.expenses, ...CDA_EXPENSES],
    invoices: [...s.invoices, ...CDA_INVOICES],
    salaries: [...s.salaries, ...CDA_SALARIES],
  }));

  useCrmStore.setState((s) => ({
    leads: [...s.leads, ...CDA_LEADS],
  }));

  useChatStore.setState((s) => ({
    messages: [...s.messages, ...CDA_CHAT],
  }));
}
