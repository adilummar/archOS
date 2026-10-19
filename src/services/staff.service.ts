import { withAuthTx } from "@/lib/db-tx";
import { AuthContext } from "./auth.service";
import { prisma } from "@/lib/db";

import { platformPrisma } from "@/lib/platform-db";

/**
 * Resolve the real PostgreSQL firmId from a userEmail.
 * Called by staff actions to avoid trusting stale Zustand demo IDs.
 */
async function resolveFirmId(firmId: string, userEmail?: string): Promise<string | null> {
  // 1. Try by exact ID
  const byId = await platformPrisma.firm.findUnique({
    where: {
      id: firmId
    },
    select: {
      id: true
    }
  });
  if (byId) return byId.id;

  // 2. Try by slug (firmId might actually be the URL slug e.g. "cda")
  const bySlug = await platformPrisma.firm.findUnique({
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
    const user = await platformPrisma.user.findUnique({
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
  const all = await platformPrisma.firm.findMany({
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
    const today = new Date().toISOString().slice(0, 10);
    const realFirmId = await resolveFirmId(firmId, userEmail);
    if (!realFirmId) return [];
    const currentYear = new Date().getFullYear();
    const [firm, staff] = await Promise.all([
      tx.firm.findUnique({
        where: { id: realFirmId },
        select: { timezone: true, officeStartTime: true, annualLeaveQuota: true, workweekDays: true }
      }),
      tx.user.findMany({
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
          },
          leaveRequests: {
            where: {
              status: "approved",
              startDate: { gte: `${currentYear}-01-01` }
            }
          }
        },
        orderBy: {
          name: "asc"
        }
      })
    ]);

    const annualQuota = firm?.annualLeaveQuota ?? 21;
    return (staff as any[]).map((s: any) => {
      const todayApprovedLeave = s.leaveRequests?.find((l: any) => l.startDate <= today && l.endDate >= today) ?? null;
      const totalLeaveDaysThisYear = (s.leaveRequests || []).reduce((sum: number, l: any) => sum + (l.days || 0), 0);
      const leaveBalance = Math.max(0, annualQuota - totalLeaveDaysThisYear);

      return {
        ...s,
        todayApprovedLeave,
        totalLeaveDaysThisYear,
        leaveBalance,
        annualQuota,
        firmPolicy: firm
      };
    });
  });
}

/**
 * Get staff for team lead view — only staff assigned to projects
 * where teamLeadId === leadId.
 */
export async function getTeamLeadStaffWithAttendance(ctx: AuthContext, leadId: string, userEmail?: string) {
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
            },
            leaveRequests: {
              where: {
                status: "approved",
                startDate: { gte: `${new Date().getFullYear()}-01-01` }
              }
            }
          },
          orderBy: {
            name: "asc"
          }
        });

        const firm = await tx.firm.findUnique({
          where: { id: ctx.firmId },
          select: { timezone: true, officeStartTime: true, annualLeaveQuota: true, workweekDays: true }
        });
        const annualQuota = firm?.annualLeaveQuota ?? 21;

        const staffWithProjects = (staff as any[]).map((s: any) => {
          const memberOfProjects = ledProjects.filter(p => p.staffMembers.some(m => m.userId === s.id)).map(p => ({
            id: p.id,
            name: p.name
          }));
          const todayApprovedLeave = s.leaveRequests?.find((l: any) => l.startDate <= today && l.endDate >= today) ?? null;
          const totalLeaveDaysThisYear = (s.leaveRequests || []).reduce((sum: number, l: any) => sum + (l.days || 0), 0);
          const leaveBalance = Math.max(0, annualQuota - totalLeaveDaysThisYear);

          return {
            ...s,
            memberOfProjects,
            todayApprovedLeave,
            totalLeaveDaysThisYear,
            leaveBalance,
            annualQuota,
            firmPolicy: firm
          };
        });
        return staffWithProjects;
  });
}

/**
 * Get full staff profile for the detail view.
 */
export async function getStaffProfile(ctx: AuthContext, userId: string) {
  return withAuthTx(ctx, async tx => {
    // 1. Fetch user record strictly scoped to caller's firm
    const user = await tx.user.findFirst({
      where: {
        id: userId,
        firmId: ctx.firmId
      },
      include: {
        projectStaff: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
                teamLeadId: true,
                stages: {
                  where: { isArchived: false },
                  select: { id: true, name: true, order: true },
                  orderBy: { order: "asc" },
                },
                tasks: {
                  where: { isArchived: false },
                  select: { id: true, title: true, status: true, dueDate: true, priority: true, assigneeId: true },
                  orderBy: { dueDate: "asc" },
                },
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
    });

    if (!user) {
      throw Object.assign(new Error("Staff member not found"), { statusCode: 404 });
    }

    // 2. Role-based access control (never disclose inaccessible user existence)
    if (ctx.role === "staff" && userId !== ctx.userId) {
      throw Object.assign(new Error("Staff member not found"), { statusCode: 404 });
    }

    if (ctx.role === "team_lead" && userId !== ctx.userId) {
      const isMemberOfLedProject = user.projectStaff.some(
        (ps: any) => ps.project.status === "active" && ps.project.teamLeadId === ctx.userId
      );
      if (!isMemberOfLedProject) {
        throw Object.assign(new Error("Staff member not found"), { statusCode: 404 });
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [attendance, tasks, recentLogs] = await Promise.all([
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
      // All active tasks assigned to this user (both open and done for tabs filtering)
      tx.task.findMany({
        where: {
          assigneeId: userId,
          isArchived: false,
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
              name: true,
              order: true,
            }
          }
        },
        orderBy: [{
          priority: "desc"
        }, {
          dueDate: "asc"
        }],
        take: 50
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
      })
    ]);

    // Calculate attendance stats
    const presentDays = attendance.filter(a => a.checkOutTime).length;
    const totalWorkMinutes = attendance.reduce((s, a) => s + a.totalWorkMinutes, 0);
    const avgDailyMinutes = presentDays > 0 ? Math.round(totalWorkMinutes / presentDays) : 0;

    // Task and leave stats
    const [totalDone, totalPending, allLeaveRequests, firm] = await Promise.all([
      tx.task.count({
        where: {
          assigneeId: userId,
          status: "done"
        }
      }),
      tx.task.count({
        where: {
          assigneeId: userId,
          status: {
            not: "done"
          }
        }
      }),
      tx.leaveRequest.findMany({
        where: {
          userId
        },
        orderBy: {
          startDate: "desc"
        }
      }),
      tx.firm.findUnique({
        where: { id: user?.firmId || ctx.firmId },
        select: { annualLeaveQuota: true, workweekDays: true, officeStartTime: true, timezone: true }
      })
    ]);

    const approvedLeaves = allLeaveRequests.filter(l => l.status === "approved" && l.startDate >= `${new Date().getFullYear()}-01-01`);
    const totalLeaveDaysThisYear = approvedLeaves.reduce((sum, l) => sum + l.days, 0);
    const annualQuota = firm?.annualLeaveQuota ?? 21;
    const leaveBalance = Math.max(0, annualQuota - totalLeaveDaysThisYear);

    // Derived workload percentage: weighted by open tasks and current activity
    const workload = totalPending === 0 ? 0 : Math.min(95, Math.max(35, Math.round((totalPending / Math.max(5, totalPending + totalDone)) * 100)));

    return {
      user,
      attendance,
      todaySession: attendance.find(a => a.date === today) ?? null,
      tasks,
      recentLogs,
      approvedLeaves,
      allLeaveRequests,
      firmPolicy: firm,
      stats: {
        presentDays,
        totalWorkMinutes,
        avgDailyMinutes,
        totalDone,
        totalPending,
        totalLeaveDaysThisYear,
        annualQuota,
        leaveBalance,
        workload
      }
    };
  });
}


