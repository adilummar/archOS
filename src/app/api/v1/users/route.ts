import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import * as UserService from "@/services/user.service";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (ctx, req: any) => {
  // Test 2 & 3: STAFF & TEAM_LEAD -> user-management API Expected: 403
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await UserService.getStaff(ctx);
    return NextResponse.json({ data: users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (ctx, req: any) => {
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const newUser = await UserService.createUser(ctx, data);
    return NextResponse.json({ success: true, data: newUser });
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
