import { withAuthTx } from "@/lib/db-tx";
import { AuthContext } from "./auth.service";
import { parseISO, format, addDays, isSameDay } from "date-fns";

export interface CreateLeaveInput {
  type?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason?: string;
}

export interface LeaveFilter {
  status?: string;
  month?: string; // YYYY-MM
  userId?: string;
}

/**
 * Calculates business days between start and end date inclusive,
 * counting only days included in the firm's workweekDays array.
 * ISO weekday: 1 = Monday, ..., 7 = Sunday.
 */
function calculateBusinessDays(startDateStr: string, endDateStr: string, workweekDays: number[]): number {
  const start = parseISO(startDateStr);
  const end = parseISO(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

  let count = 0;
  let current = start;
  while (current <= end) {
    // getDay() returns 0 for Sunday, 1 for Monday... 6 for Saturday.
    // Convert to ISO weekday (1=Mon ... 7=Sun)
    const dayOfWeek = current.getDay();
    const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek;
    if (workweekDays.includes(isoDay)) {
      count++;
    }
    current = addDays(current, 1);
  }
  return count;
}

/**
 * Creates a new leave request for the authenticated user with concurrency locks,
 * overlap prevention, business days calculation, and activity logging.
 */
export async function createLeaveRequest(ctx: AuthContext, data: CreateLeaveInput) {
  if (!data.startDate || !data.endDate) {
    throw Object.assign(new Error("Start date and end date are required"), { code: "VALIDATION_ERROR" });
  }

  const start = parseISO(data.startDate);
  const end = parseISO(data.endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw Object.assign(new Error("Invalid date format. Expected YYYY-MM-DD"), { code: "VALIDATION_ERROR" });
  }

  if (start > end) {
    throw Object.assign(new Error("End date must be on or after start date"), { code: "VALIDATION_ERROR" });
  }

  return withAuthTx(ctx, async (tx) => {
    // 1. Fetch firm policy settings
    const firm = await tx.firm.findUnique({
      where: { id: ctx.firmId },
      select: { workweekDays: true, annualLeaveQuota: true }
    });
    const workweekDays = firm?.workweekDays?.length ? firm.workweekDays : [1, 2, 3, 4, 5];

    // 2. Calculate business days
    const days = calculateBusinessDays(data.startDate, data.endDate, workweekDays);
    if (days <= 0) {
      throw Object.assign(new Error("Selected date range contains 0 working days"), { code: "VALIDATION_ERROR" });
    }

    // 3. Acquire exclusive row lock on the user to serialize concurrent leave submissions
    await tx.$executeRaw`SELECT id FROM "User" WHERE id = ${ctx.userId} AND "firmId" = ${ctx.firmId} FOR UPDATE`;

    // 4. Check for overlapping active (pending or approved) requests for this user
    const overlap = await tx.leaveRequest.findFirst({
      where: {
        firmId: ctx.firmId,
        userId: ctx.userId,
        status: { in: ["pending", "approved"] },
        startDate: { lte: data.endDate },
        endDate: { gte: data.startDate }
      }
    });

    if (overlap) {
      throw Object.assign(
        new Error(`You already have an active leave request overlapping these dates (${overlap.startDate} to ${overlap.endDate})`),
        { code: "CONFLICT", statusCode: 409 }
      );
    }

    // 5. Create LeaveRequest in PostgreSQL
    const request = await tx.leaveRequest.create({
      data: {
        firmId: ctx.firmId,
        userId: ctx.userId,
        type: data.type || "annual",
        startDate: data.startDate,
        endDate: data.endDate,
        days,
        reason: data.reason?.trim() || null,
        status: "pending"
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
        }
      }
    });

    // 6. Record immutable server activity log
    await tx.activityLog.create({
      data: {
        firmId: ctx.firmId,
        userId: ctx.userId,
        entity: "leave",
        entityId: request.id,
        action: "requested",
        description: `${request.user.name} requested ${days} day(s) leave (${request.startDate} → ${request.endDate})`
      }
    });

    return request;
  });
}

/**
 * Retrieves leave requests filtered by firm, role, status, and month.
 * Computes authoritative task submission clashes for pending requests.
 */
export async function getLeaveRequests(ctx: AuthContext, filter: LeaveFilter = {}) {
  return withAuthTx(ctx, async (tx) => {
    let allowedUserIds: string[] | null = null;

    if (ctx.role === "staff" || ctx.role === "accounts") {
      // Staff and accounts can only see their own requests
      allowedUserIds = [ctx.userId];
    } else if (ctx.role === "team_lead") {
      // Team lead sees own requests + requests from staff assigned to their active led projects
      const ledProjects = await tx.project.findMany({
        where: {
          firmId: ctx.firmId,
          teamLeadId: ctx.userId,
          status: "active"
        },
        include: {
          staffMembers: {
            select: { userId: true }
          }
        }
      });

      const memberIdSet = new Set<string>([ctx.userId]);
      for (const p of ledProjects) {
        for (const m of p.staffMembers) {
          memberIdSet.add(m.userId);
        }
      }
      allowedUserIds = Array.from(memberIdSet);
    }
    // Admin sees all users (allowedUserIds remains null)

    const whereClause: any = {
      firmId: ctx.firmId
    };

    if (allowedUserIds !== null) {
      whereClause.userId = { in: allowedUserIds };
    }

    if (filter.userId && (ctx.role === "admin" || filter.userId === ctx.userId || (allowedUserIds && allowedUserIds.includes(filter.userId)))) {
      whereClause.userId = filter.userId;
    }

    if (filter.status && filter.status !== "all") {
      whereClause.status = filter.status;
    }

    // Month filter (YYYY-MM): leave requests that overlap the month
    if (filter.month && /^\d{4}-\d{2}$/.test(filter.month)) {
      const monthStart = `${filter.month}-01`;
      const monthEnd = `${filter.month}-31`;
      whereClause.startDate = { lte: monthEnd };
      whereClause.endDate = { gte: monthStart };
    }

    const requests = await tx.leaveRequest.findMany({
      where: whereClause,
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
        reviewer: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Compute task submission clashes for pending requests
    const enriched = await Promise.all(
      requests.map(async (req) => {
        if (req.status !== "pending") {
          return { ...req, submissionClashes: [] };
        }

        const start = parseISO(req.startDate);
        const end = new Date(parseISO(req.endDate).getTime() + 24 * 60 * 60 * 1000 - 1);

        const clashingTasks = await tx.task.findMany({
          where: {
            firmId: ctx.firmId,
            assigneeId: req.userId,
            dueDate: {
              gte: start,
              lte: end
            },
            status: { notIn: ["done", "completed"] }
          },
          include: {
            project: {
              select: { name: true }
            }
          },
          take: 5
        });

        const submissionClashes = clashingTasks.map((t) => ({
          taskId: t.id,
          taskTitle: t.title,
          projectName: t.project?.name || "Project",
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          role: "Task owner"
        }));

        return {
          ...req,
          submissionClashes
        };
      })
    );

    return enriched;
  });
}

/**
 * Validates whether the caller has review authority over the target leave request.
 * Enforces strict project-level boundaries for team leads.
 */
async function validateReviewAuthority(tx: any, ctx: AuthContext, leaveReq: any) {
  if (ctx.role === "admin") {
    return true; // Admins have firm-wide approval authority
  }

  if (ctx.role === "team_lead") {
    if (leaveReq.userId === ctx.userId) {
      throw Object.assign(new Error("Team leads cannot approve their own leave requests"), {
        code: "FORBIDDEN",
        statusCode: 403
      });
    }

    // Verify applicant is a member of an active project led by this team lead
    const membership = await tx.projectStaff.findFirst({
      where: {
        userId: leaveReq.userId,
        project: {
          firmId: ctx.firmId,
          teamLeadId: ctx.userId,
          status: "active"
        }
      }
    });

    if (!membership) {
      throw Object.assign(
        new Error("Forbidden: You can only review leave requests for staff assigned to your active projects"),
        { code: "FORBIDDEN", statusCode: 403 }
      );
    }
    return true;
  }

  throw Object.assign(new Error("Forbidden: Only administrators and team leads can review leave"), {
    code: "FORBIDDEN",
    statusCode: 403
  });
}

/**
 * Approves a pending leave request atomically.
 */
export async function approveLeaveRequest(ctx: AuthContext, requestId: string, note?: string) {
  return withAuthTx(ctx, async (tx) => {
    const leaveReq = await tx.leaveRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: { name: true } } }
    });

    if (!leaveReq || leaveReq.firmId !== ctx.firmId) {
      throw Object.assign(new Error("Leave request not found"), { code: "NOT_FOUND", statusCode: 404 });
    }

    if (leaveReq.status !== "pending") {
      throw Object.assign(new Error(`Cannot approve leave request in '${leaveReq.status}' status`), {
        code: "CONFLICT",
        statusCode: 409
      });
    }

    await validateReviewAuthority(tx, ctx, leaveReq);

    // Atomic conditional update
    const updatedCount = await tx.leaveRequest.updateMany({
      where: {
        id: requestId,
        firmId: ctx.firmId,
        status: "pending"
      },
      data: {
        status: "approved",
        reviewedById: ctx.userId,
        reviewedAt: new Date()
      }
    });

    if (updatedCount.count === 0) {
      throw Object.assign(new Error("Leave request was already decided by another reviewer"), {
        code: "CONFLICT",
        statusCode: 409
      });
    }

    // Server audit log
    await tx.activityLog.create({
      data: {
        firmId: ctx.firmId,
        userId: ctx.userId,
        entity: "leave",
        entityId: requestId,
        action: "approved",
        description: `Leave for ${leaveReq.user.name} approved (${leaveReq.startDate} → ${leaveReq.endDate})`
      }
    });

    return tx.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        user: { select: { id: true, name: true, avatarInitials: true, role: true } },
        reviewer: { select: { id: true, name: true } }
      }
    });
  });
}

/**
 * Rejects a pending leave request atomically with a required reason.
 */
export async function rejectLeaveRequest(ctx: AuthContext, requestId: string, note: string) {
  if (!note || !note.trim()) {
    throw Object.assign(new Error("Rejection reason is required"), { code: "VALIDATION_ERROR", statusCode: 422 });
  }

  return withAuthTx(ctx, async (tx) => {
    const leaveReq = await tx.leaveRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: { name: true } } }
    });

    if (!leaveReq || leaveReq.firmId !== ctx.firmId) {
      throw Object.assign(new Error("Leave request not found"), { code: "NOT_FOUND", statusCode: 404 });
    }

    if (leaveReq.status !== "pending") {
      throw Object.assign(new Error(`Cannot reject leave request in '${leaveReq.status}' status`), {
        code: "CONFLICT",
        statusCode: 409
      });
    }

    await validateReviewAuthority(tx, ctx, leaveReq);

    // Atomic conditional update
    const updatedCount = await tx.leaveRequest.updateMany({
      where: {
        id: requestId,
        firmId: ctx.firmId,
        status: "pending"
      },
      data: {
        status: "rejected",
        reviewedById: ctx.userId,
        reviewedAt: new Date(),
        rejectionNote: note.trim()
      }
    });

    if (updatedCount.count === 0) {
      throw Object.assign(new Error("Leave request was already decided by another reviewer"), {
        code: "CONFLICT",
        statusCode: 409
      });
    }

    // Server audit log
    await tx.activityLog.create({
      data: {
        firmId: ctx.firmId,
        userId: ctx.userId,
        entity: "leave",
        entityId: requestId,
        action: "rejected",
        description: `Leave for ${leaveReq.user.name} rejected: ${note.trim()}`
      }
    });

    return tx.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        user: { select: { id: true, name: true, avatarInitials: true, role: true } },
        reviewer: { select: { id: true, name: true } }
      }
    });
  });
}

/**
 * Cancels a pending leave request (retains audit trail with cancelled status).
 */
export async function cancelLeaveRequest(ctx: AuthContext, requestId: string) {
  return withAuthTx(ctx, async (tx) => {
    const leaveReq = await tx.leaveRequest.findUnique({
      where: { id: requestId }
    });

    if (!leaveReq || leaveReq.firmId !== ctx.firmId) {
      throw Object.assign(new Error("Leave request not found"), { code: "NOT_FOUND", statusCode: 404 });
    }

    if (leaveReq.status !== "pending") {
      throw Object.assign(new Error(`Only pending leave requests can be cancelled (current: '${leaveReq.status}')`), {
        code: "CONFLICT",
        statusCode: 409
      });
    }

    // Only applicant or admin can cancel
    if (leaveReq.userId !== ctx.userId && ctx.role !== "admin") {
      throw Object.assign(new Error("You can only cancel your own leave requests"), {
        code: "FORBIDDEN",
        statusCode: 403
      });
    }

    await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledById: ctx.userId
      }
    });

    await tx.activityLog.create({
      data: {
        firmId: ctx.firmId,
        userId: ctx.userId,
        entity: "leave",
        entityId: requestId,
        action: "cancelled",
        description: `Leave request (${leaveReq.startDate} → ${leaveReq.endDate}) cancelled`
      }
    });

    return { success: true, id: requestId, status: "cancelled" };
  });
}
