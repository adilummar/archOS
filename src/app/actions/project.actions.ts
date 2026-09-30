"use server";
import { getSession } from "@/lib/session";
import { getAuthContext } from "@/services/auth.service";
import { revalidatePath } from "next/cache";
import * as Service from "@/services/project.service";

async function getCtx() {
  const session = await getSession();
  if (!session.userId) throw new Error("Unauthorized");
  return getAuthContext(session.userId);
}

export async function getProjects(firmId: string) {
  const ctx = await getCtx();
  const result = await Service.getProjects(ctx, firmId);
  console.log("DEBUG PROJECTS:", result.map(p => ({ id: p.id, name: p.name, status: p.status })));
  return result;
}

export async function getProject(projectId: string) {
  const ctx = await getCtx();
  const result = await Service.getProject(ctx, projectId);
  return result;
}

export async function createProject(data: {
  firmId: string;
  name: string;
  clientId?: string;
  clientName?: string;
  teamLeadId?: string;
  staffIds?: string[];
  location?: string;
  description?: string;
  startDate?: Date;
  expectedEndDate?: Date;
  feeAgreed?: number;
  feeStructure?: string;
  projectValue?: number;
}) {
  const ctx = await getCtx();
  const result = await Service.createProject(ctx, data);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return result;
}

export async function updateProject(projectId: string,
  data: Partial<{
    name: string;
    status: string;
    location: string;
    description: string;
    expectedEndDate: Date;
    actualEndDate: Date;
    teamLeadId: string;
    feeAgreed: number;
    chatEnabled: boolean;
  }>
) {
  const ctx = await getCtx();
  const result = await Service.updateProject(ctx, projectId, data);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return result;
}

export async function addStaffToProject(projectId: string, userId: string) {
  const ctx = await getCtx();
  const result = await Service.addStaffToProject(ctx, projectId, userId);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return result;
}

export async function removeStaffFromProject(projectId: string, userId: string) {
  const ctx = await getCtx();
  const result = await Service.removeStaffFromProject(ctx, projectId, userId);
  return result;
}

export async function createProjectStage(data: {
  projectId: string;
  name: string;
  order: number;
  description?: string;
  isClientApprovalRequired?: boolean;
  plannedEndDate?: Date;
}) {
  const ctx = await getCtx();
  const result = await Service.createProjectStage(ctx, data);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return result;
}

export async function updateStageStatus(stageId: string,
  status: string,
  firmId: string,
  userId?: string
) {
  const ctx = await getCtx();
  const result = await Service.updateStageStatus(ctx, stageId, status, firmId, userId);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return result;
}

export async function instantiateProjectFromTemplate(data: {
  firmId: string;
  templateId: string;
  name: string;
  clientId?: string;
  clientName?: string;
  teamLeadId?: string;
  staffIds?: string[];
  location?: string;
  description?: string;
  startDate?: Date;
  expectedEndDate?: Date;
  feeAgreed?: number;
  projectValue?: number;
}) {
  const ctx = await getCtx();
  const result = await Service.instantiateProjectFromTemplate(ctx, data);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return result;
}

export async function updateProjectTemplate(firmId: string,
  projectId: string,
  newTemplateId: string,
  actorId?: string
) {
  const ctx = await getCtx();
  const result = await Service.updateProjectTemplate(ctx, firmId, projectId, newTemplateId, actorId);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return result;
}

export async function getTemplatesByFirm(firmId: string) {
  const ctx = await getCtx();
  const result = await Service.getTemplatesByFirm(ctx, firmId);
  return result;
}

export async function createClient(data: { firmId: string; name: string; email: string; }) {
  const ctx = await getCtx();
  const result = await Service.createClient(ctx, data);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return result;
}

