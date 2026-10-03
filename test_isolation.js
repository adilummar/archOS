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

  console.log("Creating Firm A...");
  const firmARes = await fetchAPI('/api/v1/platform/firms', 'POST', {
    name: "Firm A",
    slug: "firm-a-" + Date.now(),
    adminEmail: emailA,
    adminName: "Admin A"
  }, platLogin.cookie);
  
  const passA = firmARes.data.data._tempAdminPassword;

  console.log("Logging in as Firm A Admin...");
  const aLogin = await fetchAPI('/api/auth/login', 'POST', { email: emailA, password: passA });

  const projId = 'project-villa-001';

  console.log("Attempting to get foreign project with Firm A session...");
  const pB = await fetchAPI(`/api/v1/projects/${projId}`, 'GET', null, aLogin.cookie);
  console.log("Cross-tenant GET Project Result:", pB.status, pB.data);
}
run().catch(console.error);
