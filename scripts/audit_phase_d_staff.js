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

async function runPhaseD() {
  console.log("==================================================================");
  console.log("PHASE D AUDIT: STAFF & TEAM LEAD MANAGEMENT WORKFLOW");
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
  const firm = await prisma.firm.create({
    data: {
      name: `Audit Firm D ${nonce}`,
      slug: `audit-firm-d-${nonce}`,
      address: "456 Staff Avenue",
      phone: "+91 99999 22222",
      email: `firm_d_${nonce}@archos.test`,
      planType: "professional",
      status: "active"
    }
  });

  const pwdHash = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.create({
    data: {
      firmId: firm.id,
      email: `admin_d_${nonce}@archos.test`,
      name: `Admin D ${nonce}`,
      role: "admin",
      passwordHash: pwdHash,
      status: "active"
    }
  });

  const teamLead = await prisma.user.create({
    data: {
      firmId: firm.id,
      email: `lead_d_${nonce}@archos.test`,
      name: `Lead D ${nonce}`,
      role: "team_lead",
      passwordHash: pwdHash,
      status: "active"
    }
  });

  const staffInProject = await prisma.user.create({
    data: {
      firmId: firm.id,
      email: `staff_proj_${nonce}@archos.test`,
      name: `Staff Project ${nonce}`,
      role: "staff",
      passwordHash: pwdHash,
      status: "active"
    }
  });

  const staffUnassigned = await prisma.user.create({
    data: {
      firmId: firm.id,
      email: `staff_unassigned_${nonce}@archos.test`,
      name: `Staff Unassigned ${nonce}`,
      role: "staff",
      passwordHash: pwdHash,
      status: "active"
    }
  });

  // Create a project linking teamLead and staffInProject
  const project = await prisma.project.create({
    data: {
      firmId: firm.id,
      name: `Project D ${nonce}`,
      teamLeadId: teamLead.id,
      staffMembers: {
        create: [{ userId: staffInProject.id }]
      }
    }
  });

  const adminSession = await loginUser(admin.email, "Password123!");
  const leadSession = await loginUser(teamLead.email, "Password123!");
  const staffProjSession = await loginUser(staffInProject.email, "Password123!");

  // D1.1: GET /api/v1/staff by Admin returns all 4 active users
  const adminStaffList = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/staff',
    method: 'GET',
    headers: { Cookie: adminSession.cookieHeader }
  });
  assert(adminStaffList.statusCode === 200 && Array.isArray(adminStaffList.data), "D1.1: Admin GET /api/v1/staff returns list of firm staff", { count: adminStaffList.data?.length });
  const allUserIds = adminStaffList.data.map(u => u.id);
  assert(allUserIds.includes(staffInProject.id) && allUserIds.includes(staffUnassigned.id), "D1.2: Admin staff list contains all firm staff members", allUserIds);

  // D1.3: GET /api/v1/staff by Team Lead returns ONLY scoped staff (in their projects or themselves)
  const leadStaffList = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/staff',
    method: 'GET',
    headers: { Cookie: leadSession.cookieHeader }
  });
  assert(leadStaffList.statusCode === 200 && Array.isArray(leadStaffList.data), "D1.3: Team Lead GET /api/v1/staff succeeds", { count: leadStaffList.data?.length });
  const leadVisibleIds = leadStaffList.data.map(u => u.id);
  assert(leadVisibleIds.includes(staffInProject.id), "D1.4: Team Lead sees staff assigned to their project", leadVisibleIds);
  assert(!leadVisibleIds.includes(staffUnassigned.id), "D1.5: Team Lead DOES NOT see unassigned staff outside their projects", leadVisibleIds);

  // D2.1: POST /api/v1/staff by Admin creates new staff user
  const newStaffEmail = `new_hire_${nonce}@archos.test`;
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
    name: "New Junior Architect",
    email: newStaffEmail,
    role: "staff",
    designation: "Junior Architect",
    costRatePerHour: 750,
    password: "TempPassword123!"
  });

  assert(createStaffRes.statusCode === 201 && createStaffRes.data.email === newStaffEmail, "D2.1: Admin creates staff member with role 'staff' and costRatePerHour", createStaffRes.data);
  const createdStaffId = createStaffRes.data.id;

  // D2.2: POST /api/v1/staff rejects duplicate email
  const dupStaffRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/staff',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader
    }
  }, {
    name: "Duplicate User",
    email: newStaffEmail,
    role: "staff"
  });
  assert(dupStaffRes.statusCode === 422 || dupStaffRes.statusCode === 409 || dupStaffRes.statusCode === 500, "D2.2: Rejects creating user with already existing email", dupStaffRes.data);

  // D2.3: Non-admin (staff) blocked from creating staff
  const staffCreateStaffRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/staff',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staffProjSession.cookieHeader
    }
  }, {
    name: "Illegal User",
    email: `illegal_${nonce}@archos.test`,
    role: "staff"
  });
  assert(staffCreateStaffRes.statusCode === 403, "D2.3: Staff user blocked from creating users (403 Forbidden)", staffCreateStaffRes.data);

  // D2.4: Admin cannot assign invalid role like "admin" through staff endpoint
  const invalidRoleRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/staff',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader
    }
  }, {
    name: "Super Escalated",
    email: `escalate_${nonce}@archos.test`,
    role: "super_admin"
  });
  assert(invalidRoleRes.statusCode === 403 || invalidRoleRes.statusCode === 422, "D2.4: Privilege escalation prevented (invalid role rejected)", invalidRoleRes.data);

  // D3.1: Admin suspends staff member
  const suspendRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/staff/${createdStaffId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader
    }
  }, { action: "suspend" });
  assert(suspendRes.statusCode === 200 && suspendRes.data.status === "discontinued", "D3.1: Admin suspends staff member (status becomes discontinued)", suspendRes.data);

  // D3.2: Suspended user login attempt fails or withAuth rejects
  const suspendedLogin = await loginUser(newStaffEmail, "TempPassword123!");
  // If login succeeds, withAuth must block them with USER_DEACTIVATED / 403
  let suspendedBlocked = false;
  if (suspendedLogin.statusCode !== 200) {
    suspendedBlocked = true;
  } else {
    const probe = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/v1/staff',
      method: 'GET',
      headers: { Cookie: suspendedLogin.cookieHeader }
    });
    suspendedBlocked = probe.statusCode === 403;
  }
  assert(suspendedBlocked, "D3.2: Discontinued/suspended user is completely blocked from system access (403)", { loginStatus: suspendedLogin.statusCode });

  // D3.3: Admin reactivates staff member
  const unsuspendRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/staff/${createdStaffId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader
    }
  }, { action: "unsuspend" });
  assert(unsuspendRes.statusCode === 200 && unsuspendRes.data.status === "active", "D3.3: Admin reactivates staff member (status becomes active)", unsuspendRes.data);

  // D3.4: Admin changes staff password
  const newPassRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/staff/${createdStaffId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader
    }
  }, { action: "password", password: "NewStrongPassword456!" });
  assert(newPassRes.statusCode === 200, "D3.4: Admin updates staff password via PATCH /api/v1/staff/[id]", newPassRes.data);

  // Verify staff can authenticate with new password
  const newPassLogin = await loginUser(newStaffEmail, "NewStrongPassword456!");
  assert(newPassLogin.statusCode === 200, "D3.5: Staff user successfully authenticates with new password", newPassLogin.data);

  // D3.6: Non-admin cannot change another staff member's password
  const staffChangePassRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/staff/${createdStaffId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staffProjSession.cookieHeader
    }
  }, { action: "password", password: "HackedPassword999!" });
  assert(staffChangePassRes.statusCode === 403, "D3.6: Non-admin rejected from changing another user's password (403 Forbidden)", staffChangePassRes.data);

  // D3.7: Admin self-deactivation protection
  const selfDeactRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/staff/${admin.id}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminSession.cookieHeader
    }
  }, { action: "suspend" });
  assert(selfDeactRes.statusCode === 403, "D3.7: Admin cannot deactivate own account (self-preservation safeguard)", selfDeactRes.data);

  console.log(`\nPhase D Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

runPhaseD()
  .catch(err => {
    console.error("Phase D fatal:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
