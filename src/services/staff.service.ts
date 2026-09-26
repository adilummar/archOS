import { withAuthTx } from "@/lib/db-tx";
import { AuthContext } from "./auth.service";
import { prisma } from "@/lib/db";

/**
 * Resolve the real PostgreSQL firmId from a userEmail.
 * Called by staff actions to avoid trusting stale Zustand demo IDs.
 */
async function resolveFirmId(firmId: string, userEmail?: string): Promise<string | null> {
  // 1. Try by exact ID
  const byId = await prisma.firm.findUnique({
    where: {
      id: firmId
    },
    select: {
      id: true
    }
  });
  if (byId) return byId.id;

  // 2. Try by slug (firmId might actually be the URL slug e.g. "cda")
  const bySlug = await prisma.firm.findUnique({
    where: {
      slug: firmId
    },
    select: {
      id: true
    }
  });
  if (bySlug) return bySlug.id;

  // 3. Try via user's email → their firmId
  if (userEmail) {
    const user = await prisma.user.findUnique({
      where: {
        email: userEmail
      },
      select: {
        firmId: true
      }
    });
    if (user) return user.firmId;
  }

  // 4. Single-tenant fallback — return the only firm
  const all = await prisma.firm.findMany({
    select: {
      id: true
    }
  });
  if (all.length === 1) return all[0].id;
  return null;
}

/**
 * Get all staff for admin view — every active user in the firm
 * with their today's attendance session.
 */
export async function getStaffWithAttendance(ctx: AuthContext, firmId: string, userEmail?: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const today = new Date().toISOString().slice(0, 10);
        const realFirmId = await resolveFirmId(firmId, userEmail);
        if (!realFirmId) return [];
        const staff = await tx.user.findMany({
          where: {
            firmId: realFirmId,
            status: "active"
          },
          include: {
            attendanceSessions: {
              where: {
                date: today
              },
              include: {
                taskSegments: {
                  orderBy: {
                    startTime: "desc"
                  },
                  take: 10
                },
                breakRecords: {
                  orderBy: {
                    startTime: "desc"
                  },
                  take: 5
                }
              },
              take: 1
            },
            assignedTasks: {
              where: {
                status: {
                  not: "done"
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
                dueDate: "asc"
              },
              take: 5
            }
          },
          orderBy: {
            name: "asc"
          }
        });
        return staff;
      });
    });
  });
}

/**
 * Get staff for team lead view — only staff assigned to projects
 * where teamLeadId === leadId.
 */
export async function getTeamLeadStaffWithAttendance(ctx: AuthContext, leadId: string, userEmail?: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const today = new Date().toISOString().slice(0, 10);

        // Resolve real DB user ID
        let realLeadId = leadId;
        if (userEmail) {
          const dbUser = await tx.user.findUnique({
            where: {
              email: userEmail
            },
            select: {
              id: true
            }
          });
          if (dbUser) realLeadId = dbUser.id;
        }

        // Find all projects this lead manages
        const ledProjects = await tx.project.findMany({
          where: {
            teamLeadId: realLeadId,
            status: "active"
          },
          include: {
            staffMembers: {
              select: {
                userId: true
              }
            }
          }
        });
        if (ledProjects.length === 0) return [];
        const staffIdSet = new Set<string>();
        for (const p of ledProjects) {
          for (const s of p.staffMembers) {
            if (s.userId !== realLeadId) staffIdSet.add(s.userId);
          }
        }
        const staffIds = Array.from(staffIdSet);
        if (staffIds.length === 0) return [];
        const staff = await tx.user.findMany({
          where: {
            id: {
              in: staffIds
            },
            status: "active"
          },
          include: {
            attendanceSessions: {
              where: {
                date: today
              },
              include: {
                taskSegments: {
                  orderBy: {
                    startTime: "desc"
                  },
                  take: 10
                },
                breakRecords: {
                  orderBy: {
                    startTime: "desc"
                  },
                  take: 5
                }
              },
              take: 1
            },
            assignedTasks: {
              where: {
                status: {
                  not: "done"
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
                dueDate: "asc"
              },
              take: 5
            }
          },
          orderBy: {
            name: "asc"
          }
        });
        const staffWithProjects = staff.map(s => {
          const memberOfProjects = ledProjects.filter(p => p.staffMembers.some(m => m.userId === s.id)).map(p => ({
            id: p.id,
            name: p.name
          }));
          return {
            ...s,
            memberOfProjects
          };
        });
        return staffWithProjects;
      });
    });
  });
}

/**
 * Get full staff profile for the detail view.
 */
export async function getStaffProfile(ctx: AuthContext, userId: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const today = new Date().toISOString().slice(0, 10);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const [user, attendance, tasks, recentLogs] = await Promise.all([
        // Full user record
        tx.user.findUnique({
          where: {
            id: userId
          },
          include: {
            projectStaff: {
              include: {
                project: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                    teamLeadId: true
                  }
                }
              }
            },
            projectsAsLead: {
              select: {
                id: true,
                name: true,
                status: true
              },
              where: {
                status: "active"
              }
            }
          }
        }),
        // Last 30 days of attendance
        tx.attendanceSession.findMany({
          where: {
            userId,
            date: {
              gte: thirtyDaysAgo.toISOString().slice(0, 10)
            }
          },
          include: {
            taskSegments: true,
            breakRecords: true
          },
          orderBy: {
            date: "desc"
          },
          take: 30
        }),
        // All open tasks assigned to this user
        tx.task.findMany({
          where: {
            assigneeId: userId,
            status: {
              not: "done"
            }
          },
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            },
            stage: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: [{
            priority: "desc"
          }, {
            dueDate: "asc"
          }],
          take: 20
        }),
        // Recent activity logs
        tx.activityLog.findMany({
          where: {
            userId
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
          take: 10
        })]);

        // Calculate attendance stats
        const presentDays = attendance.filter(a => a.checkOutTime).length;
        const totalWorkMinutes = attendance.reduce((s, a) => s + a.totalWorkMinutes, 0);
        const avgDailyMinutes = presentDays > 0 ? Math.round(totalWorkMinutes / presentDays) : 0;

        // Task stats
        const [totalDone, totalPending] = await Promise.all([tx.task.count({
          where: {
            assigneeId: userId,
            status: "done"
          }
        }), tx.task.count({
          where: {
            assigneeId: userId,
            status: {
              not: "done"
            }
          }
        })]);
        return {
          user,
          attendance,
          todaySession: attendance.find(a => a.date === today) ?? null,
          tasks,
          recentLogs,
          stats: {
            presentDays,
            totalWorkMinutes,
            avgDailyMinutes,
            totalDone,
            totalPending
          }
        };
      });
    });
  });
}


