import { withAuthTx } from "@/lib/db-tx";
import { AuthContext } from "./auth.service";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";

const SAFE_USER_SELECT = {
  id: true,
  firmId: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  designation: true,
  avatarInitials: true,
  avatarColor: true,
  costRatePerHour: true,
  joinedAt: true,
  status: true,
  discontinuedAt: true,
};

// ── GET all staff for a firm ──────────────────────────────────────────────────────────
export async function getStaff(ctx: AuthContext, firmId?: string) {
  return withAuthTx(ctx, async tx => {
    return tx.user.findMany({
      where: {
        firmId: ctx.firmId
      },
      select: SAFE_USER_SELECT,
      orderBy: {
        name: "asc"
      }
    });
  });
}

// ── GET a single user ──────────────────────────────────────────────────────────────────
export async function getUser(ctx: AuthContext, userId: string) {
  return withAuthTx(ctx, async tx => {
    return tx.user.findUnique({
      where: {
        id: userId,
        firmId: ctx.firmId // Enforce tenant isolation
      },
      select: {
        ...SAFE_USER_SELECT,
        assignedTasks: {
          include: {
            project: { select: { name: true } }
          },
          orderBy: { dueDate: "asc" },
          take: 10
        },
        projectsAsLead: {
          select: { id: true, name: true, status: true }
        }
      }
    });
  });
}

// ── CREATE staff member ────────────────────────────────────────────────────────────────
export async function createUser(ctx: AuthContext, data: {
  firmId?: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  designation?: string;
  costRatePerHour?: number;
    password?: string;
}) {
  if (ctx.role !== "admin") {
    throw new Error("Forbidden: Only ADMIN can create users");
  }
  
  if (data.role !== "team_lead" && data.role !== "staff" && data.role !== "accounts") {
    throw new Error("Forbidden: Invalid role assignment");
  }

  return withAuthTx(ctx, async tx => {
    const initials = data.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    const colors = ["#E85D04", "#3A86FF", "#8338EC", "#06D6A0", "#FFB703"];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];
    
    const tempPassword = data.password || crypto.randomBytes(6).toString("hex");
      const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await tx.user.create({
      data: {
        firmId: ctx.firmId, // STRICTLY OVERRIDDEN
        name: data.name,
        email: data.email.toLowerCase().trim(),
        phone: data.phone,
        role: data.role,
        designation: data.designation,
        costRatePerHour: data.costRatePerHour,
        avatarInitials: initials,
        avatarColor,
        passwordHash,
        status: "active"
      },
      select: SAFE_USER_SELECT
    });

    // Record activity log
    await tx.activityLog.create({
      data: {
        firmId: ctx.firmId,
        userId: ctx.userId,
        entity: "user",
        entityId: user.id,
        action: "created",
        description: `Created user ${user.email} with role ${user.role}`
      }
    });

    return { ...user, tempPassword }; // Only returned once on creation for UX
  });
}

// ── UPDATE staff member ────────────────────────────────────────────────────────────────
export async function updateUser(ctx: AuthContext, userId: string, data: any) {
  if (ctx.role !== "admin") {
    throw new Error("Forbidden: Only ADMIN can update users");
  }

  if (userId === ctx.userId && data.status === "discontinued") {
    throw new Error("Forbidden: Cannot deactivate self");
  }
  if (userId === ctx.userId && data.role && data.role !== "admin") {
    throw new Error("Forbidden: Cannot demote self");
  }

  if (data.role && data.role !== "team_lead" && data.role !== "staff" && data.role !== "accounts" && data.role !== "admin") {
    throw new Error("Forbidden: Invalid role assignment");
  }

  return withAuthTx(ctx, async tx => {
    // Verify target user belongs to same firm
    const target = await tx.user.findUnique({ where: { id: userId, firmId: ctx.firmId } });
    if (!target) throw new Error("Not found");

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.designation !== undefined) updateData.designation = data.designation;
    if (data.costRatePerHour !== undefined) updateData.costRatePerHour = data.costRatePerHour;
    
    // Status handling
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "discontinued") updateData.discontinuedAt = new Date();
      else if (data.status === "active") updateData.discontinuedAt = null;
    }
    
    // Role handling
    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    const user = await tx.user.update({
      where: { id: userId },
      data: updateData,
      select: SAFE_USER_SELECT
    });

    let actionDetails = "updated";
    if (data.status && data.status !== target.status) {
      actionDetails = data.status === "discontinued" ? "deactivated" : "activated";
    }

    await tx.activityLog.create({
      data: {
        firmId: ctx.firmId,
        userId: ctx.userId,
        entity: "user",
        entityId: user.id,
        action: actionDetails,
        description: `Updated user profile`
      }
    });

    return user;
  });
}

// ── GET staff assigned to a project ─────────────────────────────────────────────────────
export async function getProjectStaff(ctx: AuthContext, projectId: string) {
  return withAuthTx(ctx, async tx => {
    return tx.projectStaff.findMany({
      where: {
        projectId,
        project: { firmId: ctx.firmId } // firm isolation
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            designation: true,
            avatarInitials: true,
            avatarColor: true
          }
        }
      }
    });
  });
}
