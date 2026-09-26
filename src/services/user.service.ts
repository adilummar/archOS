import { withAuthTx } from "@/lib/db-tx";
import { AuthContext } from "./auth.service";
import { prisma } from "@/lib/db";

// ── GET all staff for a firm ─────────────────────────────────────────────
export async function getStaff(ctx: AuthContext, firmId: string) {
  return withAuthTx(ctx, async tx => {
    return tx.user.findMany({
      where: {
        firmId: ctx.firmId,
        status: "active"
      },
      orderBy: {
        name: "asc"
      }
    });
  });
}

// ── GET a single user ────────────────────────────────────────────────────
export async function getUser(ctx: AuthContext, userId: string) {
  return withAuthTx(ctx, async tx => {
    return tx.user.findUnique({
      where: {
        id: userId
      },
      include: {
        assignedTasks: {
          include: {
            project: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            dueDate: "asc"
          },
          take: 10
        },
        projectsAsLead: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });
  });
}

// ── CREATE staff member ──────────────────────────────────────────────────
export async function createUser(ctx: AuthContext, data: {
  firmId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  designation?: string;
  costRatePerHour?: number;
}) {
  return withAuthTx(ctx, async tx => {
    const initials = data.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    const colors = ["#E85D04", "#3A86FF", "#8338EC", "#06D6A0", "#FFB703"];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];
    const user = await tx.user.create({
      data: {
        ...data,
        avatarInitials: initials,
        avatarColor
      }
    });
    return user;
  });
}

// ── UPDATE staff member ──────────────────────────────────────────────────
export async function updateUser(ctx: AuthContext, userId: string, data: Partial<any>) {
  return withAuthTx(ctx, async tx => {
    const user = await tx.user.update({
      where: {
        id: userId
      },
      data
    });
    return user;
  });
}

// ── GET staff assigned to a project ─────────────────────────────────────
export async function getProjectStaff(ctx: AuthContext, projectId: string) {
  return withAuthTx(ctx, async tx => {
    return tx.projectStaff.findMany({
      where: {
        projectId
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
