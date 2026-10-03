const fs = require('fs');
const path = require('path');
const http = require('http');

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv(path.join(__dirname, '.env'));

const { PrismaClient } = require('@prisma/client');
const platform = new PrismaClient({
  datasources: { db: { url: process.env.PLATFORM_DATABASE_URL } },
});

function fetchAPI(port, pathName, method, body, cookie, timeoutMs = 15000) {
  const dataStr = body ? JSON.stringify(body) : '';
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  if (dataStr) headers['Content-Length'] = Buffer.byteLength(dataStr);
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: pathName, method, headers, timeout: timeoutMs }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let parsed = raw;
        let isJson = false;
        try { parsed = JSON.parse(raw); isJson = true; } catch {}
        const setCookie = res.headers['set-cookie']
          ? res.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ')
          : cookie;
        resolve({ status: res.statusCode, data: parsed, raw: raw.slice(0, 800), isJson, contentType: res.headers['content-type'] || '', cookie: setCookie });
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout ' + port + pathName)));
    req.on('error', reject);
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

async function findPort() {
  for (const port of [3001, 3000, 8081, 3002]) {
    try {
      const res = await fetchAPI(port, '/api/health', 'GET', null, null, 2500);
      if (res.status && res.status < 500) return port;
    } catch {}
  }
  return null;
}

async function run() {
  const users = await platform.user.findMany({
    where: { firmId: 'firm-coastal-001' },
    select: { id: true, name: true, email: true, role: true, status: true }
  });
  console.log('COASTAL USERS', JSON.stringify(users, null, 2));

  const vikki = await platform.user.findMany({
    where: { OR: [{ name: { contains: 'vikki', mode: 'insensitive' } }, { email: { contains: 'vikki', mode: 'insensitive' } }] },
    select: { id: true, name: true, email: true, role: true, firmId: true, status: true }
  });
  console.log('VIKKI MATCH', vikki);

  const tasks = await platform.task.findMany({
    where: { firmId: 'firm-coastal-001', status: { in: ['active', 'todo', 'assigned'] } },
    select: {
      id: true, title: true, status: true, assigneeId: true, dueDate: true, startedAt: true, projectId: true, priority: true,
      project: { select: { name: true, teamLeadId: true, staffMembers: { select: { userId: true } } } }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  console.log('ASSIGNABLE TASKS', JSON.stringify(tasks, null, 2));

  const port = await findPort();
  console.log('LIVE PORT', port);
  if (!port) return;

  const leadLogin = await fetchAPI(port, '/api/auth/login', 'POST', {
    email: 'priya@coastaldesign.in',
    password: 'archos@2024'
  });
  console.log('LEAD LOGIN', leadLogin.status, leadLogin.isJson ? JSON.stringify(leadLogin.data).slice(0, 300) : leadLogin.raw);

  const list = await fetchAPI(port, '/api/v1/tasks?firmId=firm-coastal-001', 'GET', null, leadLogin.cookie);
  console.log('GET TASKS', list.status, list.isJson ? ('count=' + (Array.isArray(list.data) ? list.data.length : 'not-array') + ' sample=' + JSON.stringify(Array.isArray(list.data) ? list.data.slice(0, 3).map(t => ({ id: t.id, title: t.title, status: t.status, assigneeId: t.assigneeId })) : list.data).slice(0, 500)) : list.raw);

  const protoRel = await fetchAPI(port, '//api/v1/tasks?firmId=firm-coastal-001', 'GET', null, leadLogin.cookie);
  console.log('PROTOREL GET', protoRel.status, protoRel.raw.slice(0, 200));

  const target = tasks.find(t => t.status === 'active' || t.status === 'todo') || tasks[0];
  if (!target) {
    console.log('NO TARGET TASK');
    return;
  }
  const staffId = target.project.staffMembers.find(s => s.userId !== target.project.teamLeadId)?.userId
    || target.project.staffMembers[0]?.userId
    || (vikki[0] && vikki[0].id);

  const body = {
    assigneeId: staffId,
    dueDate: '2026-10-29',
    priority: 'high'
  };
  console.log('ASSIGN REQUEST', { url: `/api/v1/tasks/${target.id}/assign`, body, task: { id: target.id, title: target.title, status: target.status } });

  const assignRes = await fetchAPI(port, `/api/v1/tasks/${target.id}/assign?firmId=firm-coastal-001`, 'POST', body, leadLogin.cookie);
  console.log('ASSIGN RESPONSE', assignRes.status, assignRes.contentType, assignRes.isJson ? JSON.stringify(assignRes.data) : assignRes.raw);
}

run().catch((e) => {
  console.error('TRACE ERROR', e);
  process.exitCode = 1;
}).finally(() => platform.$disconnect());
