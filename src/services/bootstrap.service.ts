import { AuthContext } from "./auth.service";
import { withAuthTx } from "@/lib/db-tx";

export type BootstrapData = {
  firm: Awaited<ReturnType<typeof getFirmBySlug>>;
  staff: Awaited<ReturnType<typeof getStaffByFirm>>;
  projects: Awaited<ReturnType<typeof getProjectsByFirm>>;
};

export async function getFirmBySlug(ctx: AuthContext, firmSlug: string) {
  return withAuthTx(ctx, async (tx) => {
    const bySlug = await tx.firm.findUnique({ where: { slug: firmSlug } });
    if (bySlug) return bySlug;

    const firms = await tx.firm.findMany();
    const byName = firms.find(
      (f) => f.name.toLowerCase().replace(/\s+/g, "-") === firmSlug || f.id === firmSlug
    );
    if (byName) return byName;

    if (firms.length === 1) return firms[0];
    return null;
  });
}

export async function getStaffByFirm(ctx: AuthContext, firmId: string) {
  return withAuthTx(ctx, async (tx) => {
    return tx.user.findMany({
      where: { firmId, status: "active" },
      orderBy: { name: "asc" },
    });
  });
}

export async function getProjectsByFirm(ctx: AuthContext, firmId: string) {
  return withAuthTx(ctx, async (tx) => {
    let where: any = { firmId };
    if (ctx.role !== "admin") {
      where.OR = [
        { teamLeadId: ctx.userId },
        { staffMembers: { some: { userId: ctx.userId } } },
        { tasks: { some: { assigneeId: ctx.userId } } }
      ];
    }
    return tx.project.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, company: true } },
        teamLead: {
          select: { id: true, name: true, avatarInitials: true, avatarColor: true },
        },
        staffMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarInitials: true,
                avatarColor: true,
              },
            },
          },
        },
        stages: { orderBy: { order: "asc" } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  });
}

export async function getProjectWithTasks(ctx: AuthContext, projectId: string) {
  return withAuthTx(ctx, async (tx) => {
    let where: any = { id: projectId, firmId: ctx.firmId };
    if (ctx.role !== "admin") {
      where.OR = [
        { teamLeadId: ctx.userId },
        { staffMembers: { some: { userId: ctx.userId } } },
        { tasks: { some: { assigneeId: ctx.userId } } }
      ];
    }
    return tx.project.findFirst({
      where,
      include: {
        client: true,
        teamLead: {
          select: {
            id: true,
            name: true,
            avatarInitials: true,
            avatarColor: true,
            role: true,
          },
        },
        staffMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarInitials: true,
                avatarColor: true,
                role: true,
                designation: true,
              },
            },
          },
        },
        stages: { orderBy: { order: "asc" } },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                avatarInitials: true,
                avatarColor: true,
              },
            },
            subtasks: { orderBy: { createdAt: "asc" } },
            stage: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  });
}
