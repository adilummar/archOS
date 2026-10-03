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
  console.log("Logging in as Admin...");
  const adminLogin = await fetchAPI('/api/auth/login', 'POST', { email: "adil@coastaldesign.in", password: "archos@2024" });
  
  const tasks = await fetchAPI('/api/v1/tasks', 'GET', null, adminLogin.cookie);
  const task = tasks.data.find(t => t.id === 'task2-001');
  console.log("Task state:", task.status);

  console.log("Test empty JSON...");
  const revRes1 = await fetchAPI(`/api/v1/tasks/${task.id}/request-revision`, 'POST', { remark: "", newDueDate: new Date().toISOString() }, adminLogin.cookie);
  console.log("Rev1 response:", revRes1.status, revRes1.data);
  
  console.log("Team Lead Request Revision WITH remark...");
  const revRes2 = await fetchAPI(`/api/v1/tasks/${task.id}/request-revision`, 'POST', { remark: "Please fix", newDueDate: new Date().toISOString() }, adminLogin.cookie);
  console.log("Rev2 response:", revRes2.status, revRes2.data);
  
  console.log("Staff submits again...");
  const submitRes = await fetchAPI(`/api/v1/tasks/${task.id}/submit-review`, 'POST', {}, adminLogin.cookie);
  console.log("Submit response:", submitRes.status, submitRes.data);
  
  console.log("Team Lead approves...");
  const appRes = await fetchAPI(`/api/v1/tasks/${task.id}/approve`, 'POST', {}, adminLogin.cookie);
  console.log("Approve response:", appRes.status, appRes.data);
}

run();

