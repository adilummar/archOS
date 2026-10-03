import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as UserService from "@/services/user.service";

export const GET = withAuth(async (ctx, req: any, { params }: any) => {
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const user = await UserService.getUser(ctx, id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ data: user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const PATCH = withAuth(async (ctx, req: any, { params }: any) => {
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const data = await req.json();
    const updatedUser = await UserService.updateUser(ctx, id, data);
    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message === "Not found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
