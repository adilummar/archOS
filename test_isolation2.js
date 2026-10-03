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
  console.log("Logging in as Platform Admin...");
  const platLogin = await fetchAPI('/api/auth/super-admin/login', 'POST', { email: "super@archos.com", password: "archos@2024" });

  const emailA = Date.now() + "admin@firma.com";

  const firmARes = await fetchAPI('/api/v1/platform/firms', 'POST', {
    name: "Firm A",
    slug: "firm-a-" + Date.now(),
    adminEmail: emailA,
    adminName: "Admin A"
  }, platLogin.cookie);
  
  const passA = firmARes.data.data._tempAdminPassword;
  const aLogin = await fetchAPI('/api/auth/login', 'POST', { email: emailA, password: passA });

  const tB = await fetchAPI(`/api/v1/tasks/task2-001`, 'GET', null, aLogin.cookie);
  console.log("Task GET:", tB.status);

  const tMut = await fetchAPI(`/api/v1/tasks/task2-001/submit-review`, 'POST', {}, aLogin.cookie);
  console.log("Task MUT:", tMut.status, tMut.data);

  const sMut = await fetchAPI(`/api/v1/staff/user-adil-001`, 'PATCH', { name: "Hacked!" }, aLogin.cookie);
  console.log("Staff MUT:", sMut.status, sMut.data);
  
  const aMut = await fetchAPI(`/api/v1/attendance/check-in`, 'POST', { taskId: "task2-001" }, aLogin.cookie);
  console.log("Attendance MUT:", aMut.status, aMut.data);
}
run().catch(console.error);
