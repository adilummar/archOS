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
          rawText: data,
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

async function runSeparationVerification() {
  console.log("==================================================================");
  console.log("STAFF MANAGEMENT & ATTENDANCE SEPARATION VERIFICATION");
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

  const nonce = Date.now().toString().slice(-6);
  const pwdHash = await bcrypt.hash("Password123!", 10);

  // Setup Firm
  const firm = await prisma.firm.create({
    data: {
      name: `Firm Separation ${nonce}`,
      slug: `firm-sep-${nonce}`,
      address: "100 Separation Way",
      phone: "+91 99999 55551",
      email: `sep_${nonce}@archos.test`,
      planType: "professional",
      status: "active",
      workweekDays: [1, 2, 3, 4, 5],
      annualLeaveQuota: 21,
      officeStartTime: "09:15",
      timezone: "Asia/Kolkata",
    }
  });

  const admin = await prisma.user.create({
    data: {
      firmId: firm.id,
      email: `admin_${nonce}@archos.test`,
      name: `Admin Separation`,
      role: "admin",
      passwordHash: pwdHash,
      status: "active",
    }
  });

  const lead = await prisma.user.create({
    data: {
      firmId: firm.id,
      email: `lead_${nonce}@archos.test`,
      name: `Lead Separation`,
      role: "team_lead",
      passwordHash: pwdHash,
      status: "active",
    }
  });

  const staff = await prisma.user.create({
    data: {
      firmId: firm.id,
      email: `staff_${nonce}@archos.test`,
      name: `Staff Separation`,
      role: "staff",
      passwordHash: pwdHash,
      status: "active",
    }
  });

  // Project with lead and staff
  const project = await prisma.project.create({
    data: {
      firmId: firm.id,
      name: `Sep Project ${nonce}`,
      teamLeadId: lead.id,
      staffMembers: { create: [{ userId: staff.id }] },
    }
  });

  const stage = await prisma.projectStage.create({
    data: {
      projectId: project.id,
      name: "Concept Design",
      order: 1,
    }
  });

  const task = await prisma.task.create({
    data: {
      firmId: firm.id,
      projectId: project.id,
      stageId: stage.id,
      title: "Design Draft",
      status: "active",
      assigneeId: staff.id,
      order: 1,
    }
  });

  // Login sessions
  const adminSession = await loginUser(admin.email, "Password123!");
  const staffSession = await loginUser(staff.email, "Password123!");

  // 1. Verify Route Delivery
  console.log("\n--- 1. Testing Route Delivery & HTML Shells ---");

  const staffPageRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/${firm.slug}/staff`,
    method: 'GET',
    headers: { Cookie: adminSession.cookieHeader }
  });
  assert(staffPageRes.statusCode === 200, "1.1: GET /[firmSlug]/staff returns 200 OK", { status: staffPageRes.statusCode });

  const attPageRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/${firm.slug}/attendance`,
    method: 'GET',
    headers: { Cookie: adminSession.cookieHeader }
  });
  assert(attPageRes.statusCode === 200, "1.2: GET /[firmSlug]/attendance returns 200 OK", { status: attPageRes.statusCode });

  const leavePageRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/${firm.slug}/leave`,
    method: 'GET',
    headers: { Cookie: adminSession.cookieHeader }
  });
  assert(leavePageRes.statusCode === 200, "1.3: GET /[firmSlug]/leave returns 200 OK (redirect target shell)", { status: leavePageRes.statusCode });

  // 2. Staff Management API & Actions
  console.log("\n--- 2. Testing Staff Management Workflows ---");

  // Admin fetches staff list
  const staffListRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/staff',
    method: 'GET',
    headers: { Cookie: adminSession.cookieHeader }
  });
  assert(staffListRes.statusCode === 200 && Array.isArray(staffListRes.data) && staffListRes.data.length >= 3,
    "2.1: Admin GET /api/v1/staff returns firm staff list with attendance context", { count: staffListRes.data?.length });

  // Admin creates new staff member
  const newStaffEmail = `newbie_${nonce}@archos.test`;
  const createStaffRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/staff',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader
    }
  }, {
    name: "Newbie Architect",
    email: newStaffEmail,
    role: "staff",
    designation: "Junior Architect",
    phone: "+91 98888 11111",
    password: "Password123!"
  });
  assert(createStaffRes.statusCode === 201 && createStaffRes.data?.email === newStaffEmail,
    "2.2: Admin creates staff member via POST /api/v1/staff", createStaffRes.data);

  const createdId = createStaffRes.data?.id;

  // Admin changes staff password
  const changePwdRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/staff/${createdId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader
    }
  }, {
    action: "password",
    password: "NewPassword456!"
  });
  assert(changePwdRes.statusCode === 200, "2.3: Admin updates staff password via PATCH /api/v1/staff/[id]", changePwdRes.data);

  // Verify new password authenticates
  const newbieLogin = await loginUser(newStaffEmail, "NewPassword456!");
  assert(newbieLogin.statusCode === 200, "2.4: New staff authenticates with changed password", newbieLogin.data);

  // Admin suspends staff member
  const suspendRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/staff/${createdId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader
    }
  }, { action: "suspend" });
  assert(suspendRes.statusCode === 200 && suspendRes.data?.status === "discontinued",
    "2.5: Admin suspends staff member via PATCH /api/v1/staff/[id]", suspendRes.data);

  // Admin reinstates staff member
  const unsuspendRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/staff/${createdId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader
    }
  }, { action: "unsuspend" });
  assert(unsuspendRes.statusCode === 200 && unsuspendRes.data?.status === "active",
    "2.6: Admin reinstates staff member via PATCH /api/v1/staff/[id]", unsuspendRes.data);

  // 3. Attendance & Leave Workflows
  console.log("\n--- 3. Testing Attendance & Leave Workflows ---");

  // Staff checks in
  const checkInRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/attendance/check-in',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staffSession.cookieHeader
    }
  }, {
    projectId: project.id,
    taskId: task.id
  });
  assert(checkInRes.statusCode === 200 && checkInRes.data?.id,
    "3.1: Staff checks in via POST /api/v1/attendance/check-in", checkInRes.data);

  const sessionId = checkInRes.data?.id;

  // Staff takes break
  const breakStartRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/attendance/break-start',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staffSession.cookieHeader
    }
  }, {
    sessionId,
    type: "lunch"
  });
  assert(breakStartRes.statusCode === 200, "3.2: Staff starts break via POST /api/v1/attendance/break-start", breakStartRes.data);

  // Staff ends break
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
  assert(breakEndRes.statusCode === 200, "3.3: Staff ends break via POST /api/v1/attendance/break-end", breakEndRes.data);

  // Staff checks out
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
  assert(checkOutRes.statusCode === 200, "3.4: Staff checks out via POST /api/v1/attendance/check-out", checkOutRes.data);

  // Staff submits leave request
  const leaveRes = await request({
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
    startDate: "2027-11-15",
    endDate: "2027-11-17",
    reason: "Vacation"
  });
  assert(leaveRes.statusCode === 201 && leaveRes.data?.id,
    "3.5: Staff submits leave request via POST /api/v1/leave", leaveRes.data);

  const leaveId = leaveRes.data?.id;

  // Admin approves leave request
  const approveLeaveRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/leave/${leaveId}/approve`,
    method: 'PATCH',
    headers: { Cookie: adminSession.cookieHeader }
  });
  assert(approveLeaveRes.statusCode === 200 && approveLeaveRes.data?.status === "approved",
    "3.6: Admin approves leave request via PATCH /api/v1/leave/[id]/approve", approveLeaveRes.data);

  // Weekly attendance summary
  const weeklyRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/attendance/weekly',
    method: 'GET',
    headers: { Cookie: adminSession.cookieHeader }
  });
  assert(weeklyRes.statusCode === 200 && Array.isArray(weeklyRes.data),
    "3.7: Weekly attendance analytics returns 200 OK array", { count: weeklyRes.data?.length });

  console.log(`\n==================================================================`);
  console.log(`VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
  console.log(`==================================================================`);
  return { passed, failed };
}

runSeparationVerification()
  .catch((err) => {
    console.error("Separation verification failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
