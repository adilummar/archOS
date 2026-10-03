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
  console.log("Logging in...");
  const login = await fetchAPI('/api/auth/login', 'POST', { email: "rahul@coastaldesign.in", password: "archos@2024" });

  const body = {
    firmId: "firm-coastal-001",
    projectId: "project-villa-001",
    taskId: "task2-001"
  };

  console.log("Firing 5 concurrent check-ins...");
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(fetchAPI('/api/v1/attendance/check-in', 'POST', body, login.cookie));
  }
  
  const results = await Promise.all(promises);
  results.forEach((r, i) => console.log(`Request ${i}:`, r.status, r.data?.error || "Success"));
}
run().catch(console.error);
