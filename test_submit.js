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
  console.log("Logging in as Admin to get a task ID...");
  const adminLogin = await fetchAPI('/api/auth/login', 'POST', { email: "adil@coastaldesign.in", password: "archos@2024" });
  
  const tasks = await fetchAPI('/api/v1/tasks', 'GET', null, adminLogin.cookie);
  const task = tasks.data.find(t => t.status === 'in_progress');
  if (!task) {
      console.log("No in_progress task found! We need to create or start one.");
      // Find an active one and start it
      const activeTask = tasks.data.find(t => t.status === 'active' || t.status === 'assigned');
      if (!activeTask) {
          console.log("No active task either!"); return;
      }
      console.log("Starting task", activeTask.id);
      const startRes = await fetchAPI(`/api/v1/tasks/${activeTask.id}/start`, 'POST', {}, adminLogin.cookie);
      console.log("Start task response:", startRes.status, startRes.data);
      if (startRes.status !== 200) return;
  }
  
  const inProgressTask = (await fetchAPI('/api/v1/tasks', 'GET', null, adminLogin.cookie)).data.find(t => t.status === 'in_progress');
  console.log("Submitting task", inProgressTask.id);
  
  const submitRes = await fetchAPI(`/api/v1/tasks/${inProgressTask.id}/submit-review`, 'POST', {}, adminLogin.cookie);
  console.log("Submit response:", submitRes.status, submitRes.data);
}

run();
