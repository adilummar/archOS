const http = require('http');

async function fetchAPI(path, method = 'GET', body = null, cookie = null) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json',
    }
  };
  if (cookie) options.headers['Cookie'] = cookie;
  
  let dataStr = '';
  if (body) {
    dataStr = JSON.stringify(body);
    options.headers['Content-Length'] = Buffer.byteLength(dataStr);
  }

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (e) {}
        
        // Next.js iron-session sets a cookie named 'archos-session' usually, let's extract it.
        let newCookie = cookie;
        if (res.headers['set-cookie']) {
            newCookie = res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
        }
        
        resolve({
          status: res.statusCode,
          data: parsed,
          cookie: newCookie
        });
      });
    });
    req.on('error', reject);
    if (body) req.write(dataStr);
    req.end();
  });
}

async function run() {
  console.log("== 1. AUTHENTICATION ==");
  const loginRes = await fetchAPI('/api/auth/login', 'POST', { email: "adil@coastaldesign.in", password: "archos@2024" });
  const adminCookie = loginRes.cookie;
  
  if (!adminCookie) {
    console.error("Failed to get admin cookie", loginRes);
    return;
  }
  
  const meRes = await fetchAPI('/api/auth/me', 'GET', null, adminCookie);
  if (meRes.status !== 200) {
      console.log("Auth failed"); return;
  }
  
  const firmId = meRes.data.user.firmId;
  const adminId = meRes.data.user.id;
  console.log(`[PASS] Admin Auth (firmId: ${firmId})`);

  console.log("\\n== 2. TASK HTTP SECURITY ==");
  
  const unauthRes = await fetchAPI(`/api/v1/tasks?firmId=${firmId}`);
  console.log(`[${unauthRes.status === 401 ? 'PASS' : 'FAIL'}] Unauthenticated -> ${unauthRes.status}`);
  
  const wrongTenantRes = await fetchAPI(`/api/v1/tasks?firmId=fake-firm-123`, 'GET', null, adminCookie);
  console.log(`[${[403, 404, 401].includes(wrongTenantRes.status) ? 'PASS' : 'FAIL'}] Wrong tenant -> ${wrongTenantRes.status}`);

  const adminTasksRes = await fetchAPI(`/api/v1/tasks?firmId=${firmId}`, 'GET', null, adminCookie);
  console.log(`[${adminTasksRes.status === 200 ? 'PASS' : 'FAIL'}] ADMIN permitted operation -> ${adminTasksRes.status}`);

  console.log("\\n== 3. STAFF HTTP SECURITY ==");
  
  const staffUnauthRes = await fetchAPI(`/api/v1/staff?firmId=${firmId}`);
  console.log(`[${staffUnauthRes.status === 401 ? 'PASS' : 'FAIL'}] Unauthenticated -> ${staffUnauthRes.status}`);

  const staffReadRes = await fetchAPI(`/api/v1/staff?firmId=${firmId}`, 'GET', null, adminCookie);
  console.log(`[${staffReadRes.status === 200 ? 'PASS' : 'FAIL'}] ADMIN read staff -> ${staffReadRes.status}`);
  
  if (staffReadRes.status === 200) {
    const hasHash = JSON.stringify(staffReadRes.data).includes('passwordHash');
    console.log(`[${!hasHash ? 'PASS' : 'FAIL'}] passwordHash omitted from API`);
  }

  console.log("\\n== 4. ATTENDANCE HTTP SECURITY ==");
  const attUnauth = await fetchAPI(`/api/v1/attendance?firmId=${firmId}&userId=${adminId}`);
  console.log(`[${attUnauth.status === 401 ? 'PASS' : 'FAIL'}] Unauthenticated -> ${attUnauth.status}`);
  
  const attCheckinEmpty = await fetchAPI(`/api/v1/attendance/check-in?firmId=${firmId}`, 'POST', {}, adminCookie);
  console.log(`[${attCheckinEmpty.status >= 400 ? 'PASS' : 'FAIL'}] Check-in without task -> ${attCheckinEmpty.status}`);

  // Test Team Lead login
  const tlLogin = await fetchAPI('/api/auth/login', 'POST', { email: "priya@coastaldesign.in", password: "archos@2024" });
  const tlCookie = tlLogin.cookie;
  
  // Team lead tries to manage staff (create)
  const tlCreateStaff = await fetchAPI(`/api/v1/staff?firmId=${firmId}`, 'POST', { name: 'Test', email: 'test@t.com', role: 'staff' }, tlCookie);
  console.log(`[${tlCreateStaff.status === 403 ? 'PASS' : 'FAIL'}] TEAM_LEAD manage staff -> ${tlCreateStaff.status}`);
  
  // Test Staff login
  const stLogin = await fetchAPI('/api/auth/login', 'POST', { email: "rahul@coastaldesign.in", password: "archos@2024" });
  const stCookie = stLogin.cookie;

  const stCreateStaff = await fetchAPI(`/api/v1/staff?firmId=${firmId}`, 'POST', { name: 'Test', email: 'test@t.com', role: 'staff' }, stCookie);
  console.log(`[${stCreateStaff.status === 403 ? 'PASS' : 'FAIL'}] STAFF manage staff -> ${stCreateStaff.status}`);

  console.log("\\nTesting Dashboard Isolation (Staff viewing admin dashboard stats)");
  // Since dashboard data fetching happens via /api/v1/tasks and /api/v1/staff, 
  // staff reading staff should be restricted (if staff feature restricts it)
  // Actually, staff/route.ts: if (ctx.role === 'team_lead') gets their team, else gets all firm staff. Wait, if ctx.role is staff, it returns getStaffWithAttendance which might succeed?
  const stReadStaff = await fetchAPI(`/api/v1/staff?firmId=${firmId}`, 'GET', null, stCookie);
  console.log(`[INFO] STAFF read staff API -> ${stReadStaff.status}`); // Might be 200 if staff is allowed to see colleagues, or 403.
}

run().catch(console.error);
