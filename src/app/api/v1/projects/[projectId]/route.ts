import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as ProjectService from "@/services/project.service";
import { getAuthContext } from "@/services/auth.service";
import { requireFeature } from "@/services/feature.service";

export const GET = withAuth(async (ctx, req, context: any) => {
  await requireFeature(ctx, "PROJECTS");
  const project = await ProjectService.getProject(ctx, (await context.params).projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json(project);
});

export const PATCH = withAuth(async (ctx, req, context: any) => {
  await requireFeature(ctx, "PROJECTS");
  const data = await req.json();
  const project = await ProjectService.updateProject(ctx, (await context.params).projectId, data);
  return NextResponse.json(project);
});

export const DELETE = withAuth(async (ctx, req, context: any) => {
  await requireFeature(ctx, "PROJECTS");
  await ProjectService.deleteProject(ctx, (await context.params).projectId);
  return NextResponse.json({ success: true });
});
