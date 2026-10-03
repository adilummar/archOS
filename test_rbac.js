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
  console.log("Logging in as Staff...");
  const staffLogin = await fetchAPI('/api/auth/login', 'POST', { email: "rahul@coastaldesign.in", password: "archos@2024" });

  const mut = await fetchAPI('/api/v1/projects/project-villa-001', 'PATCH', { name: "Hacked!" }, staffLogin.cookie);
  console.log("Staff mutate Project:", mut.status, mut.data);
  
  const createStaff = await fetchAPI('/api/v1/users', 'POST', { name: "Hacked", email: "hacked@hacked.com", role: "admin", password: "password", designation: "Hacked" }, staffLogin.cookie);
  console.log("Staff create User:", createStaff.status, createStaff.data);
}
run().catch(console.error);
