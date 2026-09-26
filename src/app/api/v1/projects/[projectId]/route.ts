import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as ProjectService from "@/services/project.service";

export const GET = withAuth(async (ctx, req, context: any) => {
  const project = await ProjectService.getProject(ctx, (await context.params).projectId);
  return NextResponse.json(project);
});

export const PATCH = withAuth(async (ctx, req, context: any) => {
  const data = await req.json();
  const project = await ProjectService.updateProject(ctx, (await context.params).projectId, data);
  return NextResponse.json(project);
});


export const DELETE = withAuth(async (ctx, req, context: any) => {
  await ProjectService.deleteProject(ctx, (await context.params).projectId);
  return NextResponse.json({ success: true });
});
