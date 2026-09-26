import { getSession } from "@/lib/session";
import { AuthContext } from "./auth.service";
import { prisma } from "@/lib/db";
import { withAuthTx } from "@/lib/db-tx";
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function minutesBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

/**
 * Resolves the real PostgreSQL user ID.
 * If the passed userId doesn't exist (demo seed ID), falls back to email lookup.
 * This prevents foreign key errors when the auth store has stale demo IDs.
 */
async function resolveUserId(userId: string, email?: string): Promise<string | null> {
  // Try by ID first
  const byId = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true
    }
  });
  if (byId) return byId.id;

  // Fallback: look up by email
  if (email) {
    const byEmail = await prisma.user.findUnique({
      where: {
        email
      },
      select: {
        id: true
      }
    });
    if (byEmail) return byEmail.id;
  }
  return null;
}

// ── GET today's session for a user ───────────────────────────────────────────
export async function getTodaySession(ctx: AuthContext, userId: string, email?: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const authSession = await getSession();
        if (!ctx.userId) throw new Error("Unauthorized");
        const currentUser = await tx.user.findUnique({
          where: {
            id: ctx.userId
          },
          select: {
            id: true,
            firmId: true,
            role: true
          }
        });
        if (!currentUser) throw new Error("Unauthorized");

        // Resolve to real DB user ID first
        const realUserId = await resolveUserId(userId, email);
        if (!realUserId) return null;
        return tx.attendanceSession.findUnique({
          where: {
            userId_date: {
              userId: realUserId,
              date: todayStr()
            }
          },
          include: {
            taskSegments: {
              orderBy: {
                startTime: "asc"
              }
            },
            breakRecords: {
              orderBy: {
                startTime: "asc"
              }
            }
          }
        });
      });
    });
  });
}

// ── CHECK IN ─────────────────────────────────────────────────────────────────
export async function checkIn(ctx: AuthContext, data: {
  userId: string;
  email?: string; // optional fallback for ID resolution
  firmId: string;
  projectId: string;
  taskId: string;
}) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const authSession = await getSession();
        if (!ctx.userId) throw new Error("Unauthorized");
        const currentUser = await tx.user.findUnique({
          where: {
            id: ctx.userId
          },
          select: {
            id: true,
            firmId: true,
            role: true
          }
        });
        if (!currentUser) throw new Error("Unauthorized");

        // Resolve to real PostgreSQL user ID (handles demo seed ID mismatch)
        const realUserId = await resolveUserId(data.userId, data.email);
        if (!realUserId) {
          throw new Error(`User not found in database. userId=${data.userId}, email=${data.email}`);
        }

        // Resolve firm ID too — firm might have a different ID in DB
        const existing = await tx.attendanceSession.findUnique({
          where: {
            userId_date: {
              userId: realUserId,
              date: todayStr()
            }
          },
          include: {
            taskSegments: true,
            breakRecords: true
          }
        });
        if (existing) return existing;

        // Get real firmId from the user record
        const dbUser = await tx.user.findUnique({
          where: {
            id: realUserId
          },
          select: {
            firmId: true
          }
        });
        const realFirmId = dbUser?.firmId ?? data.firmId;
        const session = await tx.attendanceSession.create({
          data: {
            userId: realUserId,
            firmId: realFirmId,
            date: todayStr(),
            status: "working",
            currentProjectId: data.projectId,
            currentTaskId: data.taskId,
            checkInTime: new Date(),
            taskSegments: {
              create: {
                projectId: data.projectId,
                taskId: data.taskId,
                startTime: new Date()
              }
            }
          },
          include: {
            taskSegments: true,
            breakRecords: true
          }
        });
        await tx.activityLog.create({
          data: {
            firmId: realFirmId,
            userId: realUserId,
            projectId: data.projectId,
            entity: "attendance",
            entityId: session.id,
            action: "checked_in",
            description: `Checked in and started working`
          }
        });
        return session;
      });
    });
  });
}

// ── SWITCH TASK ──────────────────────────────────────────────────────────────
// Close current task segment, optionally mark task done, start new segment.
export async function switchTask(ctx: AuthContext, data: {
  sessionId: string;
  firmId: string;
  userId: string;
  newProjectId: string;
  newTaskId: string;
  markCurrentTaskDone: boolean;
}) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const authSession = await getSession();
        if (!ctx.userId) throw new Error("Unauthorized");
        const currentUser = await tx.user.findUnique({
          where: {
            id: ctx.userId
          },
          select: {
            id: true,
            firmId: true,
            role: true
          }
        });
        if (!currentUser) throw new Error("Unauthorized");
        const session = await tx.attendanceSession.findUnique({
          where: {
            id: data.sessionId
          },
          include: {
            taskSegments: {
              orderBy: {
                startTime: "desc"
              },
              take: 1
            }
          }
        });
        if (!session) throw new Error("Session not found");
        const now = new Date();

        // Close the current open task segment
        const currentSegment = session.taskSegments[0];
        if (currentSegment && !currentSegment.endTime) {
          await tx.taskTimeSegment.update({
            where: {
              id: currentSegment.id
            },
            data: {
              endTime: now,
              durationMinutes: minutesBetween(new Date(currentSegment.startTime), now),
              taskCompletedOnSwitch: data.markCurrentTaskDone
            }
          });

          // If user marked task as done, update the Task record (if it exists in DB)
          if (data.markCurrentTaskDone) {
            await tx.task.updateMany({
              where: {
                id: currentSegment.taskId
              },
              data: {
                status: "done",
                completedAt: now
              }
            });
            await tx.activityLog.create({
              data: {
                firmId: data.firmId,
                userId: data.userId,
                projectId: currentSegment.projectId,
                entity: "task",
                entityId: currentSegment.taskId,
                action: "status_changed",
                description: `Task marked as done via attendance switch`
              }
            });
          }
        }

        // Open new task segment
        await tx.taskTimeSegment.create({
          data: {
            sessionId: data.sessionId,
            projectId: data.newProjectId,
            taskId: data.newTaskId,
            startTime: now
          }
        });

        // Update session's current task
        const updated = await tx.attendanceSession.update({
          where: {
            id: data.sessionId
          },
          data: {
            currentProjectId: data.newProjectId,
            currentTaskId: data.newTaskId,
            status: "working"
          },
          include: {
            taskSegments: true,
            breakRecords: true
          }
        });
        return updated;
      });
    });
  });
}

// ── TAKE A BREAK ─────────────────────────────────────────────────────────────
export async function takeBreak(ctx: AuthContext, sessionId: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const authSession = await getSession();
        if (!ctx.userId) throw new Error("Unauthorized");
        const currentUser = await tx.user.findUnique({
          where: {
            id: ctx.userId
          },
          select: {
            id: true,
            firmId: true,
            role: true
          }
        });
        if (!currentUser) throw new Error("Unauthorized");
        const now = new Date();
        const session = await tx.attendanceSession.findUnique({
          where: {
            id: sessionId
          },
          include: {
            taskSegments: {
              orderBy: {
                startTime: "desc"
              },
              take: 1
            }
          }
        });
        if (!session) throw new Error("Session not found");

        // Close current task segment (pause it — will resume later)
        const currentSegment = session.taskSegments[0];
        if (currentSegment && !currentSegment.endTime) {
          await tx.taskTimeSegment.update({
            where: {
              id: currentSegment.id
            },
            data: {
              endTime: now,
              durationMinutes: minutesBetween(new Date(currentSegment.startTime), now)
            }
          });
        }

        // Create break record
        await tx.breakRecord.create({
          data: {
            sessionId,
            startTime: now
          }
        });
        const updated = await tx.attendanceSession.update({
          where: {
            id: sessionId
          },
          data: {
            status: "on_break"
          },
          include: {
            taskSegments: true,
            breakRecords: true
          }
        });
        return updated;
      });
    });
  });
}

// ── RESUME WORK ──────────────────────────────────────────────────────────────
export async function resumeWork(ctx: AuthContext, sessionId: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const authSession = await getSession();
        if (!ctx.userId) throw new Error("Unauthorized");
        const currentUser = await tx.user.findUnique({
          where: {
            id: ctx.userId
          },
          select: {
            id: true,
            firmId: true,
            role: true
          }
        });
        if (!currentUser) throw new Error("Unauthorized");
        const now = new Date();
        const session = await tx.attendanceSession.findUnique({
          where: {
            id: sessionId
          },
          include: {
            breakRecords: {
              orderBy: {
                startTime: "desc"
              },
              take: 1
            }
          }
        });
        if (!session) throw new Error("Session not found");

        // Close the open break record
        const openBreak = session.breakRecords[0];
        if (openBreak && !openBreak.endTime) {
          await tx.breakRecord.update({
            where: {
              id: openBreak.id
            },
            data: {
              endTime: now,
              durationMinutes: minutesBetween(new Date(openBreak.startTime), now)
            }
          });
        }

        // Re-open task segment for the same task they were on
        if (session.currentTaskId && session.currentProjectId) {
          await tx.taskTimeSegment.create({
            data: {
              sessionId,
              projectId: session.currentProjectId,
              taskId: session.currentTaskId,
              startTime: now
            }
          });
        }
        const updated = await tx.attendanceSession.update({
          where: {
            id: sessionId
          },
          data: {
            status: "working"
          },
          include: {
            taskSegments: true,
            breakRecords: true
          }
        });
        return updated;
      });
    });
  });
}

// ── CHECK OUT ─────────────────────────────────────────────────────────────────
export async function checkOut(ctx: AuthContext, sessionId: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const authSession = await getSession();
        if (!ctx.userId) throw new Error("Unauthorized");
        const currentUser = await tx.user.findUnique({
          where: {
            id: ctx.userId
          },
          select: {
            id: true,
            firmId: true,
            role: true
          }
        });
        if (!currentUser) throw new Error("Unauthorized");
        const now = new Date();
        const session = await tx.attendanceSession.findUnique({
          where: {
            id: sessionId
          },
          include: {
            taskSegments: true,
            breakRecords: true
          }
        });
        if (!session) throw new Error("Session not found");

        // Use IDs from the DB session record — these are always correct
        const realFirmId = session.firmId;
        const realUserId = ctx.userId;

        // Close any open task segment
        for (const seg of session.taskSegments) {
          if (!seg.endTime) {
            await tx.taskTimeSegment.update({
              where: {
                id: seg.id
              },
              data: {
                endTime: now,
                durationMinutes: minutesBetween(new Date(seg.startTime), now)
              }
            });
          }
        }

        // Close any open break record
        for (const brk of session.breakRecords) {
          if (!brk.endTime) {
            await tx.breakRecord.update({
              where: {
                id: brk.id
              },
              data: {
                endTime: now,
                durationMinutes: minutesBetween(new Date(brk.startTime), now)
              }
            });
          }
        }

        // Calculate totals
        const allSegments = await tx.taskTimeSegment.findMany({
          where: {
            sessionId
          }
        });
        const allBreaks = await tx.breakRecord.findMany({
          where: {
            sessionId
          }
        });
        const totalWorkMinutes = allSegments.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
        const totalBreakMinutes = allBreaks.reduce((sum, b) => sum + (b.durationMinutes ?? 0), 0);
        const updated = await tx.attendanceSession.update({
          where: {
            id: sessionId
          },
          data: {
            status: "checked_out",
            checkOutTime: now,
            totalWorkMinutes,
            totalBreakMinutes
          },
          include: {
            taskSegments: true,
            breakRecords: true
          }
        });

        // Log with real DB IDs from the session
        await tx.activityLog.create({
          data: {
            firmId: realFirmId,
            userId: realUserId,
            entity: "attendance",
            entityId: sessionId,
            action: "checked_out",
            description: `Checked out — ${totalWorkMinutes} min work, ${totalBreakMinutes} min break`
          }
        });
        return updated;
      });
    });
  });
}

// ── GET attendance history for a user ────────────────────────────────────────
export async function getAttendanceHistory(ctx: AuthContext, userId: string, limit = 30) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const authSession = await getSession();
        if (!ctx.userId) throw new Error("Unauthorized");
        const currentUser = await tx.user.findUnique({
          where: {
            id: ctx.userId
          },
          select: {
            id: true,
            firmId: true,
            role: true
          }
        });
        if (!currentUser) throw new Error("Unauthorized");
        return tx.attendanceSession.findMany({
          where: {
            userId
          },
          include: {
            taskSegments: {
              include: {
                // We can't include Task directly (different DB, use taskId for lookup)
              },
              orderBy: {
                startTime: "asc"
              }
            },
            breakRecords: {
              orderBy: {
                startTime: "asc"
              }
            }
          },
          orderBy: {
            date: "desc"
          },
          take: limit
        });
      });
    });
  });
}

// ── GET firm-wide attendance for a date (admin view) ─────────────────────────
export async function getFirmAttendance(ctx: AuthContext, firmId: string, date?: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const authSession = await getSession();
        if (!ctx.userId) throw new Error("Unauthorized");
        const currentUser = await tx.user.findUnique({
          where: {
            id: ctx.userId
          },
          select: {
            id: true,
            firmId: true,
            role: true
          }
        });
        if (!currentUser) throw new Error("Unauthorized");
        const targetDate = date ?? todayStr();
        return tx.attendanceSession.findMany({
          where: {
            firmId: ctx.firmId,
            date: targetDate
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarInitials: true,
                avatarColor: true,
                designation: true,
                role: true
              }
            },
            taskSegments: {
              orderBy: {
                startTime: "asc"
              }
            },
            breakRecords: {
              orderBy: {
                startTime: "asc"
              }
            }
          },
          orderBy: {
            checkInTime: "asc"
          }
        });
      });
    });
  });
}

// ── GET task-based time breakdown for a session ───────────────────────────────
export async function getTaskTimeBreakdown(ctx: AuthContext, sessionId: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const authSession = await getSession();
        if (!ctx.userId) throw new Error("Unauthorized");
        const currentUser = await tx.user.findUnique({
          where: {
            id: ctx.userId
          },
          select: {
            id: true,
            firmId: true,
            role: true
          }
        });
        if (!currentUser) throw new Error("Unauthorized");
        const segments = await tx.taskTimeSegment.findMany({
          where: {
            sessionId
          },
          orderBy: {
            startTime: "asc"
          }
        });

        // Group by taskId — sum up all segments for the same task
        const breakdown = new Map();
        for (const seg of segments) {
          const existing = breakdown.get(seg.taskId);
          if (existing) {
            existing.totalMinutes += seg.durationMinutes ?? 0;
          } else {
            breakdown.set(seg.taskId, {
              taskId: seg.taskId,
              projectId: seg.projectId,
              totalMinutes: seg.durationMinutes ?? 0
            });
          }
        }
        return Array.from(breakdown.values());
      });
    });
  });
}


