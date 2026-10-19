const http = require('http');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function loginUser(email, password) {
  const res = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email, password });

  const rawCookies = res.headers['set-cookie'];
  const cookie = rawCookies ? rawCookies.find(c => c.startsWith('archos_session=')) : null;
  return {
    statusCode: res.statusCode,
    data: res.data,
    cookieHeader: cookie ? cookie.split(';')[0] : ''
  };
}

async function runPhaseG() {
  console.log("==================================================================");
  console.log("PHASE G AUDIT: ATTENDANCE & LEAVE WORKFLOWS (GiST CONSTRAINT)");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;
  function assert(cond, name, details) {
    if (cond) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} -> ${JSON.stringify(details)}`);
      failed++;
    }
  }

  const pwdHash = await bcrypt.hash("Password123!", 10);
  const nonce = Date.now().toString().slice(-6);

  const firm = await prisma.firm.create({
    data: {
      name: `Firm G ${nonce}`,
      slug: `firm-g-${nonce}`,
      address: "500 Attendance Way",
      phone: "+91 99999 55555",
      email: `firm_g_${nonce}@archos.test`,
      planType: "professional",
      status: "active",
      workweekDays: [1, 2, 3, 4, 5],
      annualLeaveQuota: 21
    }
  });

  const admin = await prisma.user.create({
    data: {
      firmId: firm.id,
      email: `admin_g_${nonce}@archos.test`,
      name: `Admin G`,
      role: "admin",
      passwordHash: pwdHash,
      status: "active"
    }
  });

  const staff = await prisma.user.create({
    data: {
      firmId: firm.id,
      email: `staff_g_${nonce}@archos.test`,
      name: `Staff G`,
      role: "staff",
      passwordHash: pwdHash,
      status: "active"
    }
  });

  const project = await prisma.project.create({
    data: {
      firmId: firm.id,
      name: `Project G ${nonce}`,
      teamLeadId: admin.id,
      staffMembers: { create: [{ userId: staff.id }] }
    }
  });

  const stage = await prisma.projectStage.create({
    data: {
      projectId: project.id,
      name: "Stage G",
      order: 1
    }
  });

  const task = await prisma.task.create({
    data: {
      firmId: firm.id,
      projectId: project.id,
      stageId: stage.id,
      title: "Task for Attendance Logging",
      status: "active",
      assigneeId: staff.id,
      order: 1
    }
  });

  const adminSession = await loginUser(admin.email, "Password123!");
  const staffSession = await loginUser(staff.email, "Password123!");

  // G1.1: Staff Check-In
  const checkInRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/attendance/check-in',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staffSession.cookieHeader
    }
  }, { projectId: project.id, taskId: task.id });
  const sessionId = checkInRes.data?.id || checkInRes.data?.session?.id;
  assert(checkInRes.statusCode === 200 && sessionId, "G1.1: Staff checks in via POST /api/v1/attendance/check-in", checkInRes.data);

  // G1.2: Verify AttendanceSession in DB
  const dbSession = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
  assert(dbSession !== null && dbSession.checkInTime !== null && dbSession.userId === staff.id, "G1.2: AttendanceSession record persisted in PostgreSQL", dbSession);

  // G1.3: Staff Start Break
  const breakStartRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/attendance/break-start',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staffSession.cookieHeader
    }
  }, { sessionId });
  assert(breakStartRes.statusCode === 200, "G1.3: Staff starts break via POST /api/v1/attendance/break-start", breakStartRes.data);

  // G1.4: Staff End Break
  const breakEndRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/attendance/break-end',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staffSession.cookieHeader
    }
  }, { sessionId });
  assert(breakEndRes.statusCode === 200, "G1.4: Staff ends break via POST /api/v1/attendance/break-end", breakEndRes.data);

  // G1.5: Switch Task
  const switchRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/attendance/switch',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staffSession.cookieHeader
    }
  }, { projectId: project.id, taskId: task.id });
  assert(switchRes.statusCode === 200, "G1.5: Switches active task timer via POST /api/v1/attendance/switch", switchRes.data);

  // Verify TaskTimeSegment created
  const timeSegments = await prisma.taskTimeSegment.findMany({ where: { sessionId, taskId: task.id } });
  assert(timeSegments.length > 0, "G1.6: TaskTimeSegment opened for active task", timeSegments[0]);

  // G1.7: Staff Check-Out
  const checkOutRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/attendance/check-out',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staffSession.cookieHeader
    }
  }, { sessionId });
  assert(checkOutRes.statusCode === 200, "G1.7: Staff checks out via POST /api/v1/attendance/check-out", checkOutRes.data);

  // G1.8: Weekly Attendance Endpoint
  const weeklyRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/attendance/weekly',
    method: 'GET',
    headers: { Cookie: staffSession.cookieHeader }
  });
  assert(weeklyRes.statusCode === 200, "G1.8: Weekly attendance summary returns 200 OK", weeklyRes.data);

  // ── LEAVE MANAGEMENT & GiST CONSTRAINT AUDIT ──────────────────────────────

  // G2.1: Staff Submits Leave Request (Mon to Wed)
  const leaveStart1 = "2027-06-07"; // Monday
  const leaveEnd1 = "2027-06-09";   // Wednesday (3 working days)

  const leave1Res = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/leave',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staffSession.cookieHeader
    }
  }, {
    type: "annual",
    startDate: leaveStart1,
    endDate: leaveEnd1,
    reason: "Family vacation"
  });
  assert(leave1Res.statusCode === 201 && leave1Res.data.status === "pending" && leave1Res.data.days === 3, "G2.1: Staff submits leave request (status pending, days=3)", leave1Res.data);
  const leave1Id = leave1Res.data.id;

  // G2.2: Overlapping Leave Request Rejection (GiST exclusion constraint & service check)
  // Attempting Tue to Thu (overlaps Wed June 9)
  const overlapRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/leave',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staffSession.cookieHeader
    }
  }, {
    type: "annual",
    startDate: "2027-06-08",
    endDate: "2027-06-10",
    reason: "Conflicting request"
  });
  assert(overlapRes.statusCode === 409 || overlapRes.statusCode === 422 || overlapRes.statusCode === 500, "G2.2: Overlapping active leave request strictly rejected (409/422/500)", { status: overlapRes.statusCode, data: overlapRes.data });

  // G2.3: Self-Approval Prevention via PATCH /api/v1/leave/[id]/approve
  const selfApproveRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/leave/${leave1Id}/approve`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staffSession.cookieHeader
    }
  }, {});
  assert(selfApproveRes.statusCode === 403, "G2.3: Staff self-approval strictly blocked (403 Forbidden)", selfApproveRes.data);

  // G2.4: Admin Approves Leave Request via PATCH /api/v1/leave/[id]/approve
  const adminApproveRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/leave/${leave1Id}/approve`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader
    }
  }, {});
  assert(adminApproveRes.statusCode === 200 && adminApproveRes.data.status === "approved", "G2.4: Admin approves leave request (status transitions to approved)", adminApproveRes.data);

  // G2.5: Staff Submits Second Leave Request & Cancels It
  const leaveStart2 = "2027-07-05"; // Monday
  const leaveEnd2 = "2027-07-07";   // Wednesday

  const leave2Res = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/leave',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staffSession.cookieHeader
    }
  }, {
    type: "annual",
    startDate: leaveStart2,
    endDate: leaveEnd2,
    reason: "Personal appointment"
  });
  assert(leave2Res.statusCode === 201, "G2.5: Submits second leave request", leave2Res.data);
  const leave2Id = leave2Res.data.id;

  const cancelRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/leave/${leave2Id}/cancel`,
    method: 'PATCH',
    headers: { Cookie: staffSession.cookieHeader }
  });
  assert(cancelRes.statusCode === 200 && cancelRes.data.status === "cancelled", "G2.6: Staff cancels pending leave request (status transitions to cancelled)", cancelRes.data);

  // G2.7: Re-submitting for Cancelled Dates SUCCEEDS (Cancelled leaves do NOT block future requests)
  const reSubmitRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/leave',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staffSession.cookieHeader
    }
  }, {
    type: "annual",
    startDate: leaveStart2,
    endDate: leaveEnd2,
    reason: "Rescheduled personal appointment"
  });
  assert(reSubmitRes.statusCode === 201 && reSubmitRes.data.status === "pending", "G2.7: Re-submitting for previously cancelled dates succeeds without GiST conflict", reSubmitRes.data);

  console.log(`\nPhase G Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

runPhaseG()
  .catch(err => {
    console.error("Phase G fatal:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
