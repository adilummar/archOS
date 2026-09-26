import { withAuthTx } from "@/lib/db-tx";
import { AuthContext } from "./auth.service";
import { prisma } from "@/lib/db";

// ── GLOBAL LOGS — all activity across the entire firm ────────────────────
export async function getGlobalLogs(ctx: AuthContext, firmId: string, limit = 100) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        return tx.activityLog.findMany({
          where: {
            firmId
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarInitials: true,
                avatarColor: true
              }
            },
            project: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          },
          take: limit
        });
      });
    });
  });
}

// ── PROJECT LOGS — activity scoped to one project ────────────────────────
export async function getProjectLogs(ctx: AuthContext, projectId: string, limit = 100) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        return tx.activityLog.findMany({
          where: {
            projectId
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarInitials: true,
                avatarColor: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          },
          take: limit
        });
      });
    });
  });
}

// ── USER LOGS — all activity by a specific staff member ──────────────────
export async function getUserLogs(ctx: AuthContext, userId: string, firmId: string, limit = 50) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        return tx.activityLog.findMany({
          where: {
            userId,
            firmId
          },
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          },
          take: limit
        });
      });
    });
  });
}

// ── USER LOGS BY DATE — fetch activity for a specific date ──────────────────
export async function getUserLogsByDate(ctx: AuthContext, userId: string, dateStr: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        // dateStr format: "YYYY-MM-DD"
        const start = new Date(`${dateStr}T00:00:00.000Z`);
        const end = new Date(`${dateStr}T23:59:59.999Z`);
        return tx.activityLog.findMany({
          where: {
            userId,
            createdAt: {
              gte: start,
              lte: end
            }
          },
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        });
      });
    });
  });
}

// ── WRITE a log entry manually ───────────────────────────────────────────
export async function createLog(ctx: AuthContext, data: {
  firmId: string;
  userId?: string;
  projectId?: string;
  entity: string;
  entityId: string;
  action: string;
  description: string;
}) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        return tx.activityLog.create({
          data
        });
      });
    });
  });
}

// ── TIME LOGS: Start session ─────────────────────────────────────────────
export async function startTimeLog(ctx: AuthContext, data: {
  firmId: string;
  userId: string;
  projectId: string;
  phase?: string;
  notes?: string;
}) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        return tx.timeLog.create({
          data: {
            ...data,
            startTime: new Date(),
            date: new Date()
          }
        });
      });
    });
  });
}

// ── TIME LOGS: Stop session ──────────────────────────────────────────────
export async function stopTimeLog(ctx: AuthContext, timeLogId: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const log = await tx.timeLog.findUnique({
          where: {
            id: timeLogId
          }
        });
        if (!log) return null;
        const endTime = new Date();
        const durationMinutes = Math.round((endTime.getTime() - new Date(log.startTime).getTime()) / 60000);
        return tx.timeLog.update({
          where: {
            id: timeLogId
          },
          data: {
            endTime,
            durationMinutes
          }
        });
      });
    });
  });
}

// ── TIME LOGS: Get by project ────────────────────────────────────────────
export async function getTimeLogsByProject(ctx: AuthContext, projectId: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        return tx.timeLog.findMany({
          where: {
            projectId
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarInitials: true,
                avatarColor: true
              }
            }
          },
          orderBy: {
            date: "desc"
          }
        });
      });
    });
  });
}

// ── TIME LOGS: Get by user ───────────────────────────────────────────────
export async function getTimeLogsByUser(ctx: AuthContext, userId: string, firmId: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        return tx.timeLog.findMany({
          where: {
            userId,
            firmId
          },
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            date: "desc"
          }
        });
      });
    });
  });
}

// ── GLOBAL LOG SUMMARY: stats for dashboard ──────────────────────────────
export async function getLogStats(ctx: AuthContext, firmId: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const [totalLogs, todayLogs, projectCount, taskCount] = await Promise.all([tx.activityLog.count({
          where: {
            firmId
          }
        }), tx.activityLog.count({
          where: {
            firmId: ctx.firmId,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }), tx.project.count({
          where: {
            firmId: ctx.firmId,
            status: "active"
          }
        }), tx.task.count({
          where: {
            firmId: ctx.firmId,
            status: {
              not: "done"
            }
          }
        })]);
        return {
          totalLogs,
          todayLogs,
          projectCount,
          taskCount
        };
      });
    });
  });
}