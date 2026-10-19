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
        const realUserId = ctx.userId;
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
  projectId: string;
  taskId: string;
}) {
  // ── 1. Basic input validation ─────────────────────────────────────────────
  if (!data.projectId) throw Object.assign(new Error('projectId is required'), { code: 'MISSING_FIELD' });
  if (!data.taskId) throw Object.assign(new Error('taskId is required'), { code: 'MISSING_FIELD' });

  return withAuthTx(ctx, async tx => {
    // ── 2. Verify authenticated user exists in this firm ──────────────────
    if (!ctx.userId) throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });
    const currentUser = await tx.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, firmId: true, role: true, status: true }
    });
    if (!currentUser) throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });
    if (currentUser.firmId !== ctx.firmId) throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });

    // ── 3. Validate Project: exists + belongs to this firm ────────────────
    const project = await tx.project.findFirst({
      where: { id: data.projectId, firmId: ctx.firmId }
    });
    if (!project) throw Object.assign(new Error('Project not found or not accessible'), { code: 'NOT_FOUND' });

    // ── 4. Validate ProjectStaff membership (enforced for staff role) ─────
    if (ctx.role === 'staff') {
      const membership = await tx.projectStaff.findFirst({
        where: { projectId: data.projectId, userId: ctx.userId }
      });
      if (!membership) {
        throw Object.assign(new Error('You are not a member of this project'), { code: 'FORBIDDEN' });
      }
    }

    // ── 5. Validate Task: exists + correct firm + correct project ─────────
    const task = await tx.task.findFirst({
      where: { id: data.taskId, firmId: ctx.firmId, projectId: data.projectId }
    });
    if (!task) throw Object.assign(new Error('Task not found in this project'), { code: 'NOT_FOUND' });

    // ── 6. Validate Task is assigned to this Staff ────────────────────────
    if (task.assigneeId !== ctx.userId) {
      throw Object.assign(new Error('This task is not assigned to you'), { code: 'FORBIDDEN' });
    }

    // ── 7. Validate Task is in a startable state ──────────────────────────
    // LOCKED: assigned | active | revision_requested are startable
    const STARTABLE_STATES = ['assigned', 'active', 'revision_requested'];
    if (!STARTABLE_STATES.includes(task.status)) {
      throw Object.assign(
        new Error('Task cannot be started from state: ' + task.status),
        { code: 'CONFLICT' }
      );
    }

    // ── 8. Guard: no existing open AttendanceSession ──────────────────────
    const existingSession = await tx.attendanceSession.findFirst({
      where: { userId: ctx.userId, status: { in: ['working', 'on_break'] } }
    });
    if (existingSession) {
      throw Object.assign(new Error('Staff is already checked in'), { code: 'ALREADY_CHECKED_IN' });
    }

    // ── 9. Guard: no existing open TaskTimeSegment ────────────────────────
    const existingSegment = await tx.taskTimeSegment.findFirst({
      where: { endTime: null, session: { userId: ctx.userId } }
    });
    if (existingSegment) {
      throw Object.assign(new Error('Staff already has an active task segment'), { code: 'SEGMENT_CONFLICT' });
    }

    const now = new Date();

    // ── 10. Start the Task (IN_PROGRESS) inside this transaction ─────────
    await tx.task.update({
      where: { id: data.taskId },
      data: { status: 'in_progress', startedAt: task.startedAt ?? now }
    });
    await tx.activityLog.create({
      data: {
        firmId: ctx.firmId,
        userId: ctx.userId,
        projectId: data.projectId,
        entity: 'task',
        entityId: data.taskId,
        action: 'started',
        description: 'Task started via attendance check-in'
      }
    });

    // ── 11. Create AttendanceSession + TaskTimeSegment atomically ─────────
    const session = await tx.attendanceSession.create({
      data: {
        userId: ctx.userId,
        firmId: ctx.firmId,
        date: todayStr(),
        status: 'working',
        currentProjectId: data.projectId,
        currentTaskId: data.taskId,
        checkInTime: now,
        taskSegments: {
          create: {
            projectId: data.projectId,
            taskId: data.taskId,
            startTime: now
          }
        }
      },
      include: { taskSegments: true, breakRecords: true }
    });

    await tx.activityLog.create({
      data: {
        firmId: ctx.firmId,
        userId: ctx.userId,
        projectId: data.projectId,
        entity: 'attendance',
        entityId: session.id,
        action: 'checked_in',
        description: 'Checked in and started task'
      }
    });

    return session;
  });
}

// ── SWITCH TASK ──────────────────────────────────────────────────────────────
// Phase 2: Securely switch from the current active task to a new authorized task.
// ABSOLUTE RULES:
//   - Old task REMAINS in_progress (never completed by switching)
//   - Only current open TaskTimeSegment is closed
//   - New TaskTimeSegment opened in the SAME transaction
//   - markCurrentTaskDone is REMOVED and rejected
export async function switchTask(ctx: AuthContext, data: {
  projectId: string;   // target project
  taskId: string;      // target task
}) {
  // ── 1. Basic input validation ───────────────────────────────────────────────
  if (!data.projectId) throw Object.assign(new Error('projectId is required'), { code: 'MISSING_FIELD' });
  if (!data.taskId)    throw Object.assign(new Error('taskId is required'),    { code: 'MISSING_FIELD' });

  try {
    return await withAuthTx(ctx, async tx => {
    // ── 2. Verify authenticated user ──────────────────────────────────────────
    if (!ctx.userId) throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });
    const currentUser = await tx.user.findUnique({
      where: { id: ctx.userId },
      select: { id: true, firmId: true, role: true }
    });
    if (!currentUser) throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });
    if (currentUser.firmId !== ctx.firmId) throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });

    // ── 3. Find the authenticated staff's active AttendanceSession ────────────
    const session = await tx.attendanceSession.findFirst({
      where: { userId: ctx.userId, status: { in: ['working', 'on_break'] } },
      include: {
        taskSegments: { orderBy: { startTime: 'desc' } }
      }
    });
    if (!session) {
      throw Object.assign(new Error('Staff must be checked in before switching tasks'), { code: 'NOT_CHECKED_IN' });
    }
    if (session.firmId !== ctx.firmId) {
      throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });
    }

    // ── 4. Guard: cannot switch while on break ────────────────────────────────
    if (session.status === 'on_break') {
      throw Object.assign(new Error('Cannot switch tasks while on break'), { code: 'ON_BREAK' });
    }

    // ── 5. Guard: cannot switch to current task ───────────────────────────────
    if (session.currentTaskId === data.taskId) {
      throw Object.assign(new Error('Already working on this task'), { code: 'CONFLICT' });
    }

    // ── 6. Find current open TaskTimeSegment ──────────────────────────────────
    const currentSegment = session.taskSegments.find((s: any) => !s.endTime);
    if (!currentSegment) {
      // No open segment — this can happen after stop-counting.
      // In this case we allow a "start" rather than a "switch".
      // Fall through to starting the new task without closing anything.
    }

    // ── 7. Validate target Project ────────────────────────────────────────────
    const project = await tx.project.findFirst({
      where: { id: data.projectId, firmId: ctx.firmId }
    });
    if (!project) throw Object.assign(new Error('Project not found or not accessible'), { code: 'NOT_FOUND' });

    // ── 8. Validate ProjectStaff membership (enforced for staff role) ─────────
    if (ctx.role === 'staff') {
      const membership = await tx.projectStaff.findFirst({
        where: { projectId: data.projectId, userId: ctx.userId }
      });
      if (!membership) {
        throw Object.assign(new Error('You are not a member of this project'), { code: 'FORBIDDEN' });
      }
    }

    // ── 9. Validate target Task ───────────────────────────────────────────────
    const task = await tx.task.findFirst({
      where: { id: data.taskId, firmId: ctx.firmId, projectId: data.projectId }
    });
    if (!task) throw Object.assign(new Error('Task not found in this project'), { code: 'NOT_FOUND' });

    // ── 10. Validate Task is assigned to this Staff ───────────────────────────
    if (task.assigneeId !== ctx.userId) {
      throw Object.assign(new Error('This task is not assigned to you'), { code: 'FORBIDDEN' });
    }

    // ── 11. Validate Task is startable ────────────────────────────────────────
    const STARTABLE_STATES = ['assigned', 'active', 'revision_requested', 'in_progress'];
    if (!STARTABLE_STATES.includes(task.status)) {
      throw Object.assign(
        new Error('Task cannot be started from state: ' + task.status),
        { code: 'CONFLICT' }
      );
    }

    const now = new Date();

    // ── 12. Close current open segment (if one exists) ────────────────────────
    //  CRITICAL: Old task status is NEVER changed. It remains in_progress.
    if (currentSegment) {
      const duration = Math.floor((now.getTime() - new Date(currentSegment.startTime).getTime()) / 60000);
      await tx.taskTimeSegment.update({
        where: { id: currentSegment.id },
        data: { endTime: now, durationMinutes: duration }
      });
      // taskCompletedOnSwitch is set to false — switching NEVER completes a task
      await tx.taskTimeSegment.update({
        where: { id: currentSegment.id },
        data: { taskCompletedOnSwitch: false }
      });
    }

    // ── 13. Start target Task (IN_PROGRESS) inside this transaction ───────────
    await tx.task.update({
      where: { id: data.taskId },
      data: { status: 'in_progress', startedAt: task.startedAt ?? now }
    });
    await tx.activityLog.create({
      data: {
        firmId: ctx.firmId,
        userId: ctx.userId,
        projectId: data.projectId,
        entity: 'task',
        entityId: data.taskId,
        action: 'started',
        description: 'Task started via attendance switch'
      }
    });

    // ── 14. Open new TaskTimeSegment ──────────────────────────────────────────
    await tx.taskTimeSegment.create({
      data: {
        sessionId: session.id,
        projectId: data.projectId,
        taskId: data.taskId,
        startTime: now
      }
    });

    // ── 15. Update AttendanceSession current task ─────────────────────────────
    const updated = await tx.attendanceSession.update({
      where: { id: session.id },
      data: {
        currentProjectId: data.projectId,
        currentTaskId: data.taskId,
        status: 'working'
      },
      include: { taskSegments: true, breakRecords: true }
    });

    await tx.activityLog.create({
      data: {
        firmId: ctx.firmId,
        userId: ctx.userId,
        projectId: data.projectId,
        entity: 'attendance',
        entityId: session.id,
        action: 'switched_task',
        description: 'Switched active task'
      }
    });

    return updated;
  });
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw Object.assign(new Error('Another task switch is already in progress.'), { code: 'CONFLICT' });
    }
    throw error;
  }
}

// ── TAKE A BREAK ─────────────────────────────────────────────────────────────
export async function startBreak(ctx: AuthContext, sessionId: string) {
  return withAuthTx(ctx, async tx => {
    if (!ctx.userId) throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });

    const session = await tx.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { taskSegments: { orderBy: { startTime: 'desc' }, take: 1 } }
    });

    if (!session) throw Object.assign(new Error('Session not found'), { code: 'NOT_FOUND' });
    if (session.userId !== ctx.userId || session.firmId !== ctx.firmId) {
       throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });
    }

    if (session.status !== 'working') {
       throw Object.assign(new Error('Can only start a break while working'), { code: 'CONFLICT' });
    }
    if (!session.currentTaskId || !session.currentProjectId) {
       throw Object.assign(new Error('Cannot start a break while idle'), { code: 'CONFLICT' });
    }

    const currentSegment = session.taskSegments[0];
    if (!currentSegment || currentSegment.endTime) {
       throw Object.assign(new Error('No active task segment to pause'), { code: 'CONFLICT' });
    }

    const now = new Date();
    await tx.taskTimeSegment.update({
      where: { id: currentSegment.id },
      data: {
        endTime: now,
        durationMinutes: minutesBetween(new Date(currentSegment.startTime), now)
      }
    });

    try {
      await tx.breakRecord.create({
        data: { sessionId, startTime: now }
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
         throw Object.assign(new Error('Another break is already in progress.'), { code: 'CONFLICT' });
      }
      throw error;
    }

    return await tx.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: 'on_break',
        currentTaskId: null,
        currentProjectId: null
      },
      include: { taskSegments: true, breakRecords: true }
    });
  });
}

// ── END BREAK ─────────────────────────────────────────────────────────────────
export async function endBreak(ctx: AuthContext, sessionId: string) {
  return withAuthTx(ctx, async tx => {
    if (!ctx.userId) throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });

    const session = await tx.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { breakRecords: { orderBy: { startTime: 'desc' }, take: 1 } }
    });

    if (!session) throw Object.assign(new Error('Session not found'), { code: 'NOT_FOUND' });
    if (session.userId !== ctx.userId || session.firmId !== ctx.firmId) {
       throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });
    }

    if (session.status !== 'on_break') {
       throw Object.assign(new Error('Cannot end break: not on break'), { code: 'CONFLICT' });
    }

    const openBreak = session.breakRecords[0];
    if (!openBreak || openBreak.endTime) {
       throw Object.assign(new Error('No open break record found'), { code: 'CONFLICT' });
    }

    const now = new Date();
    await tx.breakRecord.update({
      where: { id: openBreak.id },
      data: {
        endTime: now,
        durationMinutes: minutesBetween(new Date(openBreak.startTime), now)
      }
    });

    return await tx.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: 'working',
        currentTaskId: null,
        currentProjectId: null
      },
      include: { taskSegments: true, breakRecords: true }
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
        if (session.userId !== ctx.userId && ctx.role !== 'admin') throw new Error("Unauthorized");

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



// ── STOP COUNTING ─────────────────────────────────────────────────────────────
// Close the current open TaskTimeSegment without completing the task or checking out.
// Session is identified by ctx.userId — no client-supplied sessionId needed.
export async function stopCounting(ctx: AuthContext) {
  return withAuthTx(ctx, async tx => {
    if (!ctx.userId) throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });

    // Find active session by authenticated userId
    const session = await tx.attendanceSession.findFirst({
      where: { userId: ctx.userId, status: { in: ['working', 'on_break'] } },
      include: { taskSegments: { orderBy: { startTime: 'desc' } } }
    });
    if (!session) {
      throw Object.assign(new Error('No active attendance session'), { code: 'NOT_CHECKED_IN' });
    }
    if (session.firmId !== ctx.firmId) {
      throw Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' });
    }

    const now = new Date();
    const currentSegment = session.taskSegments.find((s: any) => !s.endTime);

    if (currentSegment) {
      const duration = Math.floor((now.getTime() - new Date(currentSegment.startTime).getTime()) / 60000);
      await tx.taskTimeSegment.update({
        where: { id: currentSegment.id },
        data: { endTime: now, durationMinutes: duration }
      });
    }
    // If no open segment: idempotent — still clear currentTaskId/currentProjectId

    const updated = await tx.attendanceSession.update({
      where: { id: session.id },
      data: { currentProjectId: null, currentTaskId: null }
    });
    return { ...updated, hadOpenSegment: !!currentSegment };
  });
}

/**
 * Calculates attendance rates for Monday through Friday of the current week.
 */
export async function getWeeklyAttendanceRates(ctx: AuthContext, firmId: string) {
  return withAuthTx(ctx, async (tx) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon...
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMon);

    const activeStaff = await tx.user.count({
      where: { firmId: ctx.firmId, status: "active" }
    });

    const todayStrVal = today.toISOString().slice(0, 10);
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const results = [];

    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const isFuture = dateStr > todayStrVal;

      let presentCount = 0;
      if (!isFuture) {
        presentCount = await tx.attendanceSession.count({
          where: {
            firmId: ctx.firmId,
            date: dateStr
          }
        });
      }

      const rate = activeStaff > 0 && !isFuture ? Math.min(100, Math.round((presentCount / activeStaff) * 100)) : 0;
      results.push({
        day: weekdays[i],
        date: dateStr,
        rate,
        isFuture,
        presentCount,
        activeStaff
      });
    }

    return results;
  });
}



