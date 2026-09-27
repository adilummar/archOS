const http = require('http');
const req = http.request({
  hostname: 'localhost',
  port: 8081,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('Login Response:', res.statusCode, data));
});
req.write(JSON.stringify({ email: 'adil@coastaldesign.in', password: 'archos@2024' })); 
req.end();
