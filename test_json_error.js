const http = require('http');

async function fetchAPI(path, method = 'GET', body = null, cookie = null, rawBody = null) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (cookie) options.headers['Cookie'] = cookie;
  
  let dataStr = rawBody !== null ? rawBody : (body ? JSON.stringify(body) : '');
  if (dataStr) {
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
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

async function run() {
  console.log("Logging in as Admin...");
  const adminLogin = await fetchAPI('/api/auth/login', 'POST', { email: "adil@coastaldesign.in", password: "archos@2024" });
  
  console.log("Test 1: Empty JSON body on POST /api/v1/tasks");
  const res1 = await fetchAPI('/api/v1/tasks', 'POST', null, adminLogin.cookie, "");
  console.log("Res1:", res1.status, res1.data);

  console.log("Test 2: Malformed JSON body on POST /api/v1/tasks");
  const res2 = await fetchAPI('/api/v1/tasks', 'POST', null, adminLogin.cookie, "{ invalid: true");
  console.log("Res2:", res2.status, res2.data);
}
run();
