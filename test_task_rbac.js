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
  const adminLogin = await fetchAPI('/api/auth/login', 'POST', { email: "adil@coastaldesign.in", password: "archos@2024" });

  const taskRes = await fetchAPI('/api/v1/tasks', 'POST', {
    firmId: "firm-coastal-001",
    projectId: "project-villa-001",
    title: "Unassigned RBAC Task",
    assigneeId: 'user-priya-001', assignerId: 'user-priya-001'
  }, adminLogin.cookie);
  const taskId = taskRes.data?.data?.id || taskRes.data?.id; console.log('taskRes.data:', taskRes.data); console.log('taskId:', taskId);

  const staffLogin = await fetchAPI('/api/auth/login', 'POST', { email: "rahul@coastaldesign.in", password: "archos@2024" });

  const patchTask = await fetchAPI(`/api/v1/tasks/${taskId}`, 'PATCH', { status: 'in_progress' }, staffLogin.cookie);
  console.log("Patch Task:", patchTask.status, patchTask.data);

  const delTask = await fetchAPI(`/api/v1/tasks/${taskId}`, 'DELETE', null, staffLogin.cookie);
  console.log("Del Task:", delTask.status, delTask.data);
}
run().catch(console.error);




