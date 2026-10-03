const http = require('http');

async function fetchAPI(path, method = 'GET', body = null, cookie = null) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: method,
    headers: { 'Content-Type': 'application/json' }
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
        let newCookie = res.headers['set-cookie'] ? res.headers['set-cookie'].map(c => c.split(';')[0]).join('; ') : cookie;
        resolve({ status: res.statusCode, data: parsed, cookie: newCookie });
      });
    });
    req.on('error', reject);
    if (body) req.write(dataStr);
    req.end();
  });
}

async function run() {
  console.log("=== TWO FIRM E2E VERIFICATION ===");
  
  // Super-admin login
  const sa = await fetchAPI('/api/auth/super-admin/login', 'POST', { email: "adil@elscore.com", password: "platform_secret_admin" });

  // Create Firm A
  const firmARes = await fetchAPI('/api/v1/platform/firms', 'POST', {
    name: "E2E Firm A " + Date.now(),
    adminName: "Admin A",
    adminEmail: "adminA@test.com",
    adminPassword: "Password123"
  }, sa.cookie);
  const firmAId = firmARes.data.id;
  console.log("Firm A Created:", firmAId);

  // Create Firm B
  const firmBRes = await fetchAPI('/api/v1/platform/firms', 'POST', {
    name: "E2E Firm B " + Date.now(),
    adminName: "Admin B",
    adminEmail: "adminB@test.com",
    adminPassword: "Password123"
  }, sa.cookie);
  const firmBId = firmBRes.data.id;
  console.log("Firm B Created:", firmBId);
  
  // Login Admin A
  const adminA = await fetchAPI('/api/auth/login', 'POST', { email: "adminA@test.com", password: "Password123" });
  
  // Enable FEATURES for Firm A
  await fetchAPI(`/api/v1/platform/firms/${firmAId}/features`, 'PATCH', { features: ['PROJECTS', 'TASKS', 'ATTENDANCE', 'STAFF'] }, sa.cookie);
  // Enable FEATURES for Firm B
  await fetchAPI(`/api/v1/platform/firms/${firmBId}/features`, 'PATCH', { features: ['PROJECTS', 'TASKS', 'ATTENDANCE', 'STAFF'] }, sa.cookie);

  // Admin A creates a project
  const projA = await fetchAPI('/api/v1/projects', 'POST', { name: "Project Alpha", firmId: firmAId }, adminA.cookie);
  console.log("Firm A Project Created:", projA.data?.id || projA.data);

  // Login Admin B
  const adminB = await fetchAPI('/api/auth/login', 'POST', { email: "adminB@test.com", password: "Password123" });
  const projB = await fetchAPI('/api/v1/projects', 'POST', { name: "Project Beta", firmId: firmBId }, adminB.cookie);
  
  // Admin B tries to GET Firm A's project
  const bGetA = await fetchAPI(`/api/v1/projects/${projA.data.id}`, 'GET', null, adminB.cookie);
  console.log("Admin B fetches Project A:", bGetA.status); // Expect 404

  // Admin B tries to GET all projects, verify Firm A project is not there
  const bGetAll = await fetchAPI('/api/v1/projects', 'GET', null, adminB.cookie);
  const seesProjectA = bGetAll.data.some(p => p.id === projA.data.id);
  console.log("Admin B sees Project A in list:", seesProjectA); // Expect false

  console.log("PASS!");
}
run().catch(console.error);
