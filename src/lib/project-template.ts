import type { FileCategory, ProjectTemplate, TemplateStage, TemplateTask } from "@/lib/store/types";

export type TemplateFeeStructure = ProjectTemplate["feeStructure"];
export type TemplateTaskPriority = TemplateTask["priority"];

export interface TemplateSubtaskInput {
  title: string;
  order?: number;
}

export interface TemplateTaskInput {
  title: string;
  description?: string;
  order: number;
  priority?: string;
  subtasks?: TemplateSubtaskInput[];
}

export interface TemplateStageInput {
  name: string;
  order: number;
  defaultDurationDays?: number;
  description?: string;
  isClientApprovalRequired?: boolean;
  isPaymentMilestone?: boolean;
  paymentPercentage?: number;
  drawingTypesExpected?: string[];
  tasks?: TemplateTaskInput[];
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  feeStructure?: string;
  defaultFileRequestWindowDays?: number;
  isDefault?: boolean;
  stages?: TemplateStageInput[];
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  feeStructure?: string;
  defaultFileRequestWindowDays?: number;
  isDefault?: boolean;
  stages?: TemplateStageInput[];
}

export interface TemplateSubtaskRecord {
  id: string;
  taskId: string;
  title: string;
  order: number;
}

export interface TemplateTaskRecord {
  id: string;
  stageId: string;
  title: string;
  description: string | null;
  order: number;
  priority: string;
  subtasks?: TemplateSubtaskRecord[];
}

export interface TemplateStageRecord {
  id: string;
  name: string;
  order: number;
  defaultDurationDays: number;
  description: string | null;
  isClientApprovalRequired: boolean;
  isPaymentMilestone: boolean;
  paymentPercentage: number | null;
  drawingTypesExpected: string[];
  tasks: TemplateTaskRecord[];
}

export interface TemplateRecord {
  id: string;
  firmId: string;
  name: string;
  description: string | null;
  feeStructure: string;
  defaultFileRequestWindowDays: number;
  isDefault: boolean;
  isArchived?: boolean;
  archivedAt?: Date | string | null;
  stages: TemplateStageRecord[];
}

export function parseFeeStructure(value: string): TemplateFeeStructure {
  if (value === "lump_sum" || value === "percentage" || value === "per_stage") {
    return value;
  }
  return "per_stage";
}

export function parseTaskPriority(value: string): TemplateTaskPriority {
  if (value === "low" || value === "normal" || value === "high") {
    return value;
  }
  return "normal";
}

export function parseDrawingTypes(values: string[]): FileCategory[] {
  const mapped: FileCategory[] = [];
  for (const value of values) {
    if (
      value === "architectural" ||
      value === "structural" ||
      value === "electrical" ||
      value === "interior" ||
      value === "landscape" ||
      value === "document" ||
      value === "photo" ||
      value === "report" ||
      value === "contract" ||
      value === "other"
    ) {
      mapped.push(value);
    }
  }
  return mapped;
}

export function mapTemplateRecord(template: TemplateRecord): ProjectTemplate {
  return {
    id: template.id,
    firmId: template.firmId,
    name: template.name,
    description: template.description ?? "",
    feeStructure: parseFeeStructure(template.feeStructure),
    defaultFileRequestWindowDays: template.defaultFileRequestWindowDays,
    isDefault: template.isDefault,
    isArchived: template.isArchived ?? false,
    archivedAt: template.archivedAt ? new Date(template.archivedAt).toISOString() : undefined,
    stages: template.stages.map(mapTemplateStageRecord),
  };
}

function mapTemplateStageRecord(stage: TemplateStageRecord): TemplateStage {
  return {
    id: stage.id,
    name: stage.name,
    order: stage.order,
    defaultDurationDays: stage.defaultDurationDays,
    description: stage.description ?? "",
    isClientApprovalRequired: stage.isClientApprovalRequired,
    isPaymentMilestone: stage.isPaymentMilestone,
    paymentPercentage: stage.paymentPercentage ?? undefined,
    drawingTypesExpected: parseDrawingTypes(stage.drawingTypesExpected),
    tasks: stage.tasks.map(mapTemplateTaskRecord),
  };
}

function mapTemplateTaskRecord(task: TemplateTaskRecord): TemplateTask {
  return {
    id: task.id,
    stageId: task.stageId,
    title: task.title,
    description: task.description ?? "",
    order: task.order,
    priority: parseTaskPriority(task.priority),
    subtasks: task.subtasks?.map((st) => ({
      id: st.id,
      taskId: st.taskId,
      title: st.title,
      order: st.order,
    })),
  };
}

export const DEFAULT_RESIDENTIAL_TEMPLATE_STAGES: TemplateStageInput[] = [
  {
    name: "Schematic Design",
    order: 1,
    defaultDurationDays: 21,
    description: "Site analysis and concept design",
    isClientApprovalRequired: true,
    isPaymentMilestone: true,
    paymentPercentage: 20,
    drawingTypesExpected: ["architectural"],
    tasks: [
      { title: "Site Analysis & Measurements", order: 1, priority: "high" },
      { title: "Zoning & Concept Sketches", order: 2, priority: "normal" },
      { title: "Initial Floor Plans (Options A & B)", order: 3, priority: "high" },
      { title: "Client Presentation - Concept", order: 4, priority: "normal" },
    ],
  },
  {
    name: "Design Development",
    order: 2,
    defaultDurationDays: 30,
    description: "Refined design and coordination",
    isClientApprovalRequired: true,
    isPaymentMilestone: true,
    paymentPercentage: 25,
    drawingTypesExpected: ["architectural", "structural"],
    tasks: [
      { title: "Refined Floor Plans", order: 1, priority: "high" },
      { title: "3D Massing & Exterior Elevations", order: 2, priority: "high" },
      { title: "Basic MEP Coordination Layouts", order: 3, priority: "normal" },
      { title: "Client Presentation - 3D Walkthrough", order: 4, priority: "normal" },
    ],
  },
  {
    name: "Working Drawings",
    order: 3,
    defaultDurationDays: 45,
    description: "Construction documentation",
    isClientApprovalRequired: false,
    isPaymentMilestone: true,
    paymentPercentage: 30,
    drawingTypesExpected: ["architectural", "structural", "electrical"],
    tasks: [
      { title: "GFC Floor Plans & Sections", order: 1, priority: "high" },
      { title: "Structural Drawings (from Consultant)", order: 2, priority: "high" },
      { title: "Detailed MEP Drawings", order: 3, priority: "high" },
      { title: "Joinery & Interior Details", order: 4, priority: "normal" },
      { title: "Door & Window Schedules", order: 5, priority: "normal" },
    ],
  },
  {
    name: "Tender",
    order: 4,
    defaultDurationDays: 14,
    description: "Tender documentation and bid evaluation",
    isClientApprovalRequired: false,
    isPaymentMilestone: false,
    drawingTypesExpected: ["document"],
    tasks: [
      { title: "Prepare Bill of Quantities (BOQ)", order: 1, priority: "high" },
      { title: "Issue Tender Documents to Contractors", order: 2, priority: "normal" },
      { title: "Evaluate Contractor Bids", order: 3, priority: "high" },
    ],
  },
  {
    name: "Construction",
    order: 5,
    defaultDurationDays: 180,
    description: "Site execution and quality checks",
    isClientApprovalRequired: false,
    isPaymentMilestone: true,
    paymentPercentage: 15,
    drawingTypesExpected: ["report", "photo"],
    tasks: [
      { title: "Site Handover & Marking", order: 1, priority: "high" },
      { title: "Plinth Level Check", order: 2, priority: "high" },
      { title: "Roof Slab Casting Site Visit", order: 3, priority: "high" },
      { title: "Flooring & Finishes Selection", order: 4, priority: "normal" },
    ],
  },
  {
    name: "Final Handover",
    order: 6,
    defaultDurationDays: 7,
    description: "Close-out and client sign-off",
    isClientApprovalRequired: true,
    isPaymentMilestone: true,
    paymentPercentage: 10,
    drawingTypesExpected: ["document"],
    tasks: [
      { title: "Punch List Walkthrough", order: 1, priority: "high" },
      { title: "As-Built Drawings Compilation", order: 2, priority: "normal" },
      { title: "Project Closure Sign-off", order: 3, priority: "normal" },
    ],
  },
];
