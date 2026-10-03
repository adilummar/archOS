import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as ProjectService from "@/services/project.service";
import { getAuthContext } from "@/services/auth.service";
import { requireFeature } from "@/services/feature.service";

export const POST = withAuth(async (ctx, req) => {
  await requireFeature(ctx, "PROJECTS");
  const data = await req.json();
  const project = await ProjectService.instantiateProjectFromTemplate(ctx, data);
  return NextResponse.json(project, { status: 201 });
});
