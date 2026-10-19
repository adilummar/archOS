const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function extractCookie(res, cookieName = 'archos_session') {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return null;
  for (const c of cookies) {
    if (c.startsWith(`${cookieName}=`)) {
      return c.split(';')[0];
    }
  }
  return null;
}

async function runTests() {
  console.log('==================================================================');
  console.log('STAFF MODULE REDESIGN & PROFILE ENHANCEMENTS VERIFICATION');
  console.log('==================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  const nonce = Date.now().toString().slice(-6);
  const pwdHash = await bcrypt.hash("Password123!", 10);

  const firm = await prisma.firm.create({
    data: {
      name: `Design Firm ${nonce}`,
      slug: `design-firm-${nonce}`,
      address: "200 Design Boulevard",
      phone: "+91 99999 77771",
      email: `firm_${nonce}@archos.test`,
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
      name: `Admin Designer`,
      role: "admin",
      passwordHash: pwdHash,
      status: "active",
    }
  });

  const staff = await prisma.user.create({
    data: {
      firmId: firm.id,
      email: `staff_${nonce}@archos.test`,
      name: `Alex Designer`,
      designation: "Junior Architect",
      role: "staff",
      passwordHash: pwdHash,
      status: "active",
    }
  });

  // 1. Login as Admin
  console.log('--- 1. Authenticating Admin & Staff ---');
  const adminLogin = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: admin.email, password: 'Password123!' });

  console.log('adminLogin result:', adminLogin.status, adminLogin.body?.user?.name);
  assert(adminLogin.status === 200 && adminLogin.body?.user?.id, 'Admin logged in successfully');
  const adminCookie = extractCookie(adminLogin);

  // 2. Fetch Staff List
  console.log('\n--- 2. Verifying Screen 1: Staff List API ---');
  const staffListRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/staff',
    method: 'GET',
    headers: { Cookie: adminCookie },
  });

  assert(staffListRes.status === 200 && Array.isArray(staffListRes.body), 'GET /api/v1/staff returns 200 OK array');
  const staffMembers = staffListRes.body;
  assert(Array.isArray(staffMembers) && staffMembers.length > 0, `Staff list returned ${staffMembers?.length} members`);
  
  const sampleStaff = staffMembers.find(s => s.role === 'staff') || staffMembers[0];
  console.log(`  Selected staff member for profile verification: ${sampleStaff.name} (${sampleStaff.id})`);
  assert(sampleStaff.attendanceSessions !== undefined, 'Staff list items include attendanceSessions');
  assert(sampleStaff.assignedTasks !== undefined, 'Staff list items include assignedTasks');

  // 3. Verifying Screen 2-5: Staff Profile API
  console.log('\n--- 3. Verifying Staff Profile Comprehensive Payload (Screens 2-5) ---');
  const profileRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/staff/${sampleStaff.id}`,
    method: 'GET',
    headers: { Cookie: adminCookie },
  });

  assert(profileRes.status === 200 && profileRes.body?.user, `GET /api/v1/staff/${sampleStaff.id} returns 200 OK`);
  const profile = profileRes.body;

  // Screen 2: Overview elements
  assert(profile.user && profile.user.id === sampleStaff.id, 'Profile returns authoritative user info');
  assert(Array.isArray(profile.attendance), 'Profile includes attendance history');

  // Screen 3: Tasks
  assert(Array.isArray(profile.tasks), `Profile returns assigned tasks array (${profile.tasks.length} tasks)`);

  // Screen 4: Projects (nested under user.projectStaff)
  assert(Array.isArray(profile.user.projectStaff), `Profile returns assigned projects array (${profile.user.projectStaff.length} projects)`);

  // Screen 5: Attendance & Leave Requests
  assert(Array.isArray(profile.allLeaveRequests), `Profile returns leave requests array (${profile.allLeaveRequests.length} requests)`);
  assert(profile.stats && profile.stats.workload !== undefined, `Profile stats object includes calculated workload (${profile.stats.workload}%)`);


  // 4. Test Staff Member Attribute Edit
  console.log('\n--- 4. Verifying Staff Attribute Edit (PATCH /api/v1/staff/[id]) ---');
  const updateRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/staff/${sampleStaff.id}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
  }, {
    action: 'edit',
    designation: 'Senior Architect',
    phone: '+91 9876543210'
  });

  assert(updateRes.status === 200, 'PATCH /api/v1/staff/[id] updates designation and phone');

  // Verify updated profile reflects changes
  const refetchedProfile = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/v1/staff/${sampleStaff.id}`,
    method: 'GET',
    headers: { Cookie: adminCookie },
  });

  assert(refetchedProfile.body?.user?.designation === 'Senior Architect', 'Updated designation persisted correctly');
  assert(refetchedProfile.body?.user?.phone === '+91 9876543210', 'Updated phone persisted correctly');


  console.log('\n==================================================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('==================================================================\n');

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

runTests().catch(async (err) => {
  console.error('Fatal test error:', err);
  await prisma.$disconnect();
  process.exit(1);
});

