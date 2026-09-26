const http = require('http');

const data = JSON.stringify({
  email: 'super@archos.com',
  password: 'supersecret123'
});

const options = {
  hostname: 'localhost',
  port: 8081,
  path: '/api/auth/super-admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let body = '';
  res.on('data', d => {
    body += d;
  });
  res.on('end', () => {
    console.log(body);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
