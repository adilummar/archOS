const http = require('http');
const req = http.request({
  hostname: '200.141.2.164',
  port: 8081,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  console.log('Headers:', res.headers['set-cookie']);
});
req.write(JSON.stringify({ email: 'demo@archos.com', password: 'archos2026' })); 
req.end();
