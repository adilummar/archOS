import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as ProjectService from "@/services/project.service";
import { requireFeature } from "@/services/feature.service";

export const POST = withAuth(async (ctx, req) => {
  await requireFeature(ctx, "PROJECTS");
  const data = await req.json();
  const client = await ProjectService.createClient(ctx, data);
  return NextResponse.json(client, { status: 201 });
});
