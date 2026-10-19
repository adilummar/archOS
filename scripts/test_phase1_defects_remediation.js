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

async function runRemediationVerification() {
  console.log("==================================================================");
  console.log("PHASE 1: CORE API DEFECT REMEDIATION VERIFICATION SUITE");
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

  // 1. Create Firm Alpha
  const firmAlpha = await prisma.firm.create({
    data: {
      name: `Remediation Alpha ${nonce}`,
      slug: `rem-alpha-${nonce}`,
      address: "100 Alpha Way",
      phone: "+91 99999 77771",
      email: `alpha_${nonce}@archos.test`,
      planType: "professional",
      status: "active",
      workweekDays: [1, 2, 3, 4, 5],
      annualLeaveQuota: 21
    }
  });

  const adminAlpha = await prisma.user.create({
    data: {
      firmId: firmAlpha.id,
      email: `admin_alpha_${nonce}@archos.test`,
      name: `Admin Alpha`,
      role: "admin",
      passwordHash: pwdHash,
      status: "active"
    }
  });

  const leadAlpha = await prisma.user.create({
    data: {
      firmId: firmAlpha.id,
      email: `lead_alpha_${nonce}@archos.test`,
      name: `Lead Alpha`,
      role: "team_lead",
      passwordHash: pwdHash,
      status: "active"
    }
  });

  const staffAlpha1 = await prisma.user.create({
    data: {
      firmId: firmAlpha.id,
      email: `staff1_alpha_${nonce}@archos.test`,
      name: `Staff Alpha 1`,
      role: "staff",
      passwordHash: pwdHash,
      status: "active"
    }
  });

  const staffAlpha2 = await prisma.user.create({
    data: {
      firmId: firmAlpha.id,
      email: `staff2_alpha_${nonce}@archos.test`,
      name: `Staff Alpha 2 (Unassigned)`,
      role: "staff",
      passwordHash: pwdHash,
      status: "active"
    }
  });

  // Project Alpha with Lead = leadAlpha, Staff = staffAlpha1
  const projectAlpha = await prisma.project.create({
    data: {
      firmId: firmAlpha.id,
      name: `Project Alpha ${nonce}`,
      teamLeadId: leadAlpha.id,
      staffMembers: { create: [{ userId: staffAlpha1.id }] }
    }
  });

  const stageAlpha = await prisma.projectStage.create({
    data: {
      projectId: projectAlpha.id,
      name: "Stage Alpha",
      order: 1
    }
  });

  const taskAlpha = await prisma.task.create({
    data: {
      firmId: firmAlpha.id,
      projectId: projectAlpha.id,
      stageId: stageAlpha.id,
      title: "Task Alpha 1",
      status: "in_progress",
      assigneeId: staffAlpha1.id,
      order: 1
    }
  });

  const subtask1 = await prisma.subtask.create({
    data: {
      taskId: taskAlpha.id,
      title: "Subtask Alpha 1",
      completed: false,
      createdById: staffAlpha1.id
    }
  });

  const subtask2 = await prisma.subtask.create({
    data: {
      taskId: taskAlpha.id,
      title: "Subtask Alpha 2 for Deletion",
      completed: false,
      createdById: leadAlpha.id
    }
  });

  // 2. Create Firm Beta (for multi-tenant isolation testing)
  const firmBeta = await prisma.firm.create({
    data: {
      name: `Remediation Beta ${nonce}`,
      slug: `rem-beta-${nonce}`,
      address: "200 Beta Way",
      phone: "+91 99999 77772",
      email: `beta_${nonce}@archos.test`,
      planType: "professional",
      status: "active"
    }
  });

  const adminBeta = await prisma.user.create({
    data: {
      firmId: firmBeta.id,
      email: `admin_beta_${nonce}@archos.test`,
      name: `Admin Beta`,
      role: "admin",
      passwordHash: pwdHash,
      status: "active"
    }
  });

  // Login sessions
  const adminAlphaSession = await loginUser(adminAlpha.email, "Password123!");
  const leadAlphaSession = await loginUser(leadAlpha.email, "Password123!");
  const staff1Session = await loginUser(staffAlpha1.email, "Password123!");
  const staff2Session = await loginUser(staffAlpha2.email, "Password123!");
  const adminBetaSession = await loginUser(adminBeta.email, "Password123!");

  // ────────────────────────────────────────────────────────────────
  // VERIFICATION: DEF-01 (Subtask Completion Toggle)
  // ────────────────────────────────────────────────────────────────
  console.log("\n--- Testing DEF-01: Subtask Completion Toggle ---");

  // 1.1: Assigned staff toggles subtask completion to true
  const toggleRes1 = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/subtasks/${subtask1.id}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staff1Session.cookieHeader
    }
  }, { completed: true });

  assert(toggleRes1.statusCode === 200 && toggleRes1.data.completed === true && toggleRes1.data.completedAt !== null,
    "DEF-01.1: Assigned staff toggles subtask completion to true via PATCH /api/v1/subtasks/[id]", toggleRes1.data);

  // Verify in PostgreSQL
  const dbSub1 = await prisma.subtask.findUnique({ where: { id: subtask1.id } });
  assert(dbSub1.completed === true && dbSub1.completedAt !== null,
    "DEF-01.2: Subtask completed=true and completedAt timestamp persisted in PostgreSQL", dbSub1);

  // 1.3: Toggle back to false with empty payload {} (toggle inversion)
  const toggleRes2 = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/subtasks/${subtask1.id}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staff1Session.cookieHeader
    }
  }, {});

  assert(toggleRes2.statusCode === 200 && toggleRes2.data.completed === false && toggleRes2.data.completedAt === null,
    "DEF-01.3: Inverting subtask with empty body sets completed=false and clears completedAt", toggleRes2.data);

  // 1.4: Team Lead toggles subtask
  const leadToggleRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/subtasks/${subtask1.id}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: leadAlphaSession.cookieHeader
    }
  }, { completed: true });
  assert(leadToggleRes.statusCode === 200 && leadToggleRes.data.completed === true,
    "DEF-01.4: Team Lead successfully toggles subtask", leadToggleRes.data);

  // 1.5: Unauthorized same-firm staff (not on project) blocked
  const unauthToggleRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/subtasks/${subtask1.id}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staff2Session.cookieHeader
    }
  }, { completed: false });
  assert(unauthToggleRes.statusCode === 403,
    "DEF-01.5: Unassigned staff user denied toggling subtask (403 Forbidden)", unauthToggleRes.data);

  // 1.6: Cross-tenant subtask toggle blocked with 404 (never revealing cross-tenant existence)
  const crossTenantToggle = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/subtasks/${subtask1.id}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminBetaSession.cookieHeader
    }
  }, { completed: false });
  assert(crossTenantToggle.statusCode === 404,
    "DEF-01.6: Cross-tenant subtask toggle returns 404 Not Found", crossTenantToggle.data);

  // ────────────────────────────────────────────────────────────────
  // VERIFICATION: DEF-02 (Subtask Deletion)
  // ────────────────────────────────────────────────────────────────
  console.log("\n--- Testing DEF-02: Subtask Deletion ---");

  // 2.1: Unauthorized staff (not on project) blocked from deleting subtask
  const unauthDelRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/subtasks/${subtask2.id}`,
    method: 'DELETE',
    headers: { Cookie: staff2Session.cookieHeader }
  });
  assert(unauthDelRes.statusCode === 403,
    "DEF-02.1: Unassigned staff user denied deleting subtask (403 Forbidden)", unauthDelRes.data);

  // 2.2: Cross-tenant subtask deletion blocked with 404
  const crossTenantDel = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/subtasks/${subtask2.id}`,
    method: 'DELETE',
    headers: { Cookie: adminBetaSession.cookieHeader }
  });
  assert(crossTenantDel.statusCode === 404,
    "DEF-02.2: Cross-tenant subtask deletion returns 404 Not Found", crossTenantDel.data);

  // 2.3: Authorized Lead deletes subtask via DELETE /api/v1/subtasks/[id]
  const leadDelRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/subtasks/${subtask2.id}`,
    method: 'DELETE',
    headers: { Cookie: leadAlphaSession.cookieHeader }
  });
  assert(leadDelRes.statusCode === 200 && leadDelRes.data.deleted === true,
    "DEF-02.3: Authorized Team Lead deletes subtask via DELETE /api/v1/subtasks/[id]", leadDelRes.data);

  // Verify deletion from PostgreSQL
  const dbSub2 = await prisma.subtask.findUnique({ where: { id: subtask2.id } });
  assert(dbSub2 === null,
    "DEF-02.4: Subtask record permanently removed from PostgreSQL", { dbSub2 });

  // 2.5: Deleting already deleted subtask returns 404
  const secondDelRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/subtasks/${subtask2.id}`,
    method: 'DELETE',
    headers: { Cookie: leadAlphaSession.cookieHeader }
  });
  assert(secondDelRes.statusCode === 404,
    "DEF-02.5: Re-deleting deleted subtask returns 404 Not Found", secondDelRes.data);

  // ────────────────────────────────────────────────────────────────
  // VERIFICATION: DEF-03 (Individual Task GET)
  // ────────────────────────────────────────────────────────────────
  console.log("\n--- Testing DEF-03: Individual Task GET ---");

  // 3.1: Admin retrieves individual task
  const adminTaskGet = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/tasks/${taskAlpha.id}`,
    method: 'GET',
    headers: { Cookie: adminAlphaSession.cookieHeader }
  });
  assert(adminTaskGet.statusCode === 200 && adminTaskGet.data.id === taskAlpha.id && Array.isArray(adminTaskGet.data.subtasks),
    "DEF-03.1: Admin GET /api/v1/tasks/[taskId] returns task with nested relations", { title: adminTaskGet.data?.title });

  // 3.2: Assigned staff retrieves individual task
  const staffTaskGet = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/tasks/${taskAlpha.id}`,
    method: 'GET',
    headers: { Cookie: staff1Session.cookieHeader }
  });
  assert(staffTaskGet.statusCode === 200 && staffTaskGet.data.id === taskAlpha.id,
    "DEF-03.2: Assigned staff retrieves individual task with 200 OK", { title: staffTaskGet.data?.title });

  // 3.3: Same-firm unassigned staff blocked from reading individual task
  const unauthTaskGet = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/tasks/${taskAlpha.id}`,
    method: 'GET',
    headers: { Cookie: staff2Session.cookieHeader }
  });
  assert(unauthTaskGet.statusCode === 404,
    "DEF-03.3: Same-firm unassigned staff blocked from task with 404 Not Found", unauthTaskGet.data);

  // 3.4: Cross-tenant task GET blocked with 404
  const crossTaskGet = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/tasks/${taskAlpha.id}`,
    method: 'GET',
    headers: { Cookie: adminBetaSession.cookieHeader }
  });
  assert(crossTaskGet.statusCode === 404,
    "DEF-03.4: Cross-tenant task GET returns 404 Not Found", crossTaskGet.data);

  // 3.5: Non-existent task ID returns 404
  const nonExistentTask = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/tasks/00000000-0000-0000-0000-000000000000`,
    method: 'GET',
    headers: { Cookie: adminAlphaSession.cookieHeader }
  });
  assert(nonExistentTask.statusCode === 404,
    "DEF-03.5: Non-existent task ID returns 404 Not Found", nonExistentTask.data);

  // ────────────────────────────────────────────────────────────────
  // VERIFICATION: DEF-04 (Staff Profile Not-Found Handling)
  // ────────────────────────────────────────────────────────────────
  console.log("\n--- Testing DEF-04: Staff Profile Not-Found Handling ---");

  // 4.1: Valid staff member profile returns 200 OK with full metrics
  const validProfileRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/staff/${staffAlpha1.id}`,
    method: 'GET',
    headers: { Cookie: adminAlphaSession.cookieHeader }
  });
  assert(validProfileRes.statusCode === 200 && validProfileRes.data.user?.id === staffAlpha1.id && validProfileRes.data.stats,
    "DEF-04.1: Valid staff member returns 200 OK with full profile structure", { user: validProfileRes.data?.user?.name });

  // 4.2: Non-existent user ID returns 404 Not Found (previously returned 200 with user: null)
  const missingProfileRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/staff/00000000-0000-0000-0000-000000000000`,
    method: 'GET',
    headers: { Cookie: adminAlphaSession.cookieHeader }
  });
  assert(missingProfileRes.statusCode === 404,
    "DEF-04.2: Missing user ID returns 404 Not Found (NOT 200 with user: null)", missingProfileRes.data);

  // 4.3: Cross-tenant user ID returns 404 Not Found
  const crossTenantProfile = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/staff/${adminBeta.id}`,
    method: 'GET',
    headers: { Cookie: adminAlphaSession.cookieHeader }
  });
  assert(crossTenantProfile.statusCode === 404,
    "DEF-04.3: Cross-tenant user ID returns 404 Not Found (zero cross-tenant existence disclosure)", crossTenantProfile.data);

  // 4.4: Staff member attempting to read another staff member's profile returns 404 Not Found
  const staffProbeOther = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/staff/${staffAlpha2.id}`,
    method: 'GET',
    headers: { Cookie: staff1Session.cookieHeader }
  });
  assert(staffProbeOther.statusCode === 404,
    "DEF-04.4: Staff member reading another staff member returns 404 Not Found", staffProbeOther.data);

  // ────────────────────────────────────────────────────────────────
  // VERIFICATION: DEF-05 (HTTP Status Propagation in withAuth)
  // ────────────────────────────────────────────────────────────────
  console.log("\n--- Testing DEF-05: HTTP Status Propagation in withAuth ---");

  // 5.1: Conflict propagation (409) — Submit initial leave and overlapping leave
  const leaveStart = "2027-08-09"; // Monday
  const leaveEnd = "2027-08-11";   // Wednesday

  const initialLeave = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/leave',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staff1Session.cookieHeader
    }
  }, {
    type: "annual",
    startDate: leaveStart,
    endDate: leaveEnd,
    reason: "Vacation"
  });
  assert(initialLeave.statusCode === 201, "DEF-05.1: Initial leave request created (201 Created)", initialLeave.data);

  // Overlapping request must return 409 Conflict (NOT 500 Internal Server Error)
  const overlappingLeave = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/leave',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staff1Session.cookieHeader
    }
  }, {
    type: "annual",
    startDate: "2027-08-10",
    endDate: "2027-08-12",
    reason: "Overlapping request"
  });
  assert(overlappingLeave.statusCode === 409,
    "DEF-05.2: Overlapping leave request returns clean 409 Conflict (NOT masked as 500)", overlappingLeave.data);

  // 5.3: Validation failure propagation (422)
  const badDateLeave = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/leave',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staff1Session.cookieHeader
    }
  }, {
    type: "annual",
    startDate: "2027-08-20",
    endDate: "2027-08-10", // end before start!
    reason: "Invalid dates"
  });
  assert(badDateLeave.statusCode === 422,
    "DEF-05.3: Validation error returns 422 Unprocessable Entity", badDateLeave.data);

  // 5.4: Malformed JSON payload returns 400 Bad Request
  const badJsonRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/leave',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staff1Session.cookieHeader
    }
  }, "{ malformed json ");
  assert(badJsonRes.statusCode === 400,
    "DEF-05.4: Malformed JSON payload returns 400 Bad Request", badJsonRes.data);

  // 5.5: Non-existent route returns 404 Not Found
  const notFoundRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/tasks/00000000-0000-0000-0000-000000000000`,
    method: 'GET',
    headers: { Cookie: adminAlphaSession.cookieHeader }
  });
  assert(notFoundRes.statusCode === 404,
    "DEF-05.5: Missing entity returns 404 Not Found", notFoundRes.data);

  console.log(`\n==================================================================`);
  console.log(`REMEDIATION VERIFICATION RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`==================================================================`);
  return { passed, failed };
}

runRemediationVerification()
  .catch(err => {
    console.error("Remediation verification fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
