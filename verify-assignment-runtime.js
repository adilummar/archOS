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
loadEnv(path.join(__dirname, '.env.server'));

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'commonjs',
  moduleResolution: 'node',
  esModuleInterop: true,
});

require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node',
    esModuleInterop: true,
  },
});
require('tsconfig-paths').register({
  baseUrl: __dirname,
  paths: { '@/*': ['./src/*'] },
});

const { PrismaClient } = require('@prisma/client');
const TaskService = require('./src/services/task.service.ts');

const platform = new PrismaClient({
  datasources: { db: { url: process.env.PLATFORM_DATABASE_URL } },
});

const PREFIX = 'verify-assign-' + Date.now();
const created = { projectIds: [], taskIds: [] };
const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
}

function assert(name, condition, detail) {
  record(name, Boolean(condition), detail);
  if (!condition) throw new Error(`ASSERT FAIL: ${name}${detail ? ' — ' + detail : ''}`);
}

function daysFromNow(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

function isEpoch1970(value) {
  if (!value) return false;
  return new Date(value).getTime() === 0;
}

async function fetchAPI(hostname, port, pathName, method, body, cookie, timeoutMs = 20000) {
  const dataStr = body ? JSON.stringify(body) : '';
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  if (dataStr) headers['Content-Length'] = Buffer.byteLength(dataStr);
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname, port, path: pathName, method, headers, timeout: timeoutMs }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let parsed = raw;
        let isJson = false;
        try {
          parsed = JSON.parse(raw);
          isJson = true;
        } catch {}
        const setCookie = res.headers['set-cookie']
          ? res.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ')
          : cookie;
        resolve({
          status: res.statusCode,
          data: parsed,
          raw,
          isJson,
          contentType: res.headers['content-type'] || '',
          cookie: setCookie,
        });
      });
    });
    req.on('timeout', () => {
      req.destroy(new Error(`timeout ${hostname}:${port}${pathName}`));
    });
    req.on('error', reject);
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

async function findLiveServer() {
  for (const port of [3001, 3002, 8081, 3000]) {
    try {
      const res = await fetchAPI('127.0.0.1', port, '/api/health', 'GET', null, null, 3000);
      if (res.status && res.status < 500) return port;
    } catch {}
    try {
      const res = await fetchAPI('127.0.0.1', port, '/', 'GET', null, null, 3000);
      if (res.status) return port;
    } catch {}
  }
  return null;
}

async function cleanup() {
  if (created.taskIds.length) {
    await platform.task.deleteMany({ where: { id: { in: created.taskIds } } });
  }
  if (created.projectIds.length) {
    await platform.projectStaff.deleteMany({ where: { projectId: { in: created.projectIds } } });
    await platform.project.deleteMany({ where: { id: { in: created.projectIds } } });
  }
}

async function createProject(firmId, name, teamLeadId, staffIds, startDate, expectedEndDate) {
  const project = await platform.project.create({
    data: {
      firmId,
      name,
      teamLeadId,
      status: 'active',
      startDate,
      expectedEndDate,
      staffMembers: { create: staffIds.map((userId) => ({ userId })) },
    },
  });
  created.projectIds.push(project.id);
  return project;
}

async function createTask(firmId, projectId, title, placeholderAssigneeId) {
  const task = await platform.task.create({
    data: {
      firmId,
      projectId,
      title,
      status: 'active',
      priority: 'normal',
      // Live DB currently enforces Task.assigneeId NOT NULL even though Prisma marks it optional.
      assigneeId: placeholderAssigneeId,
      assignerId: placeholderAssigneeId,
    },
  });
  created.taskIds.push(task.id);
  return task;
}

async function run() {
  const firm = await platform.firm.findUnique({ where: { id: 'firm-coastal-001' } });
  const otherFirm = await platform.firm.findFirst({ where: { id: { not: 'firm-coastal-001' } } });
  const lead = await platform.user.findUnique({ where: { id: 'user-priya-001' } });
  const staffA = await platform.user.findUnique({ where: { id: 'user-ananya-001' } });
  const staffB = await platform.user.findUnique({ where: { id: 'user-faiz-001' } });
  const otherStaff = await platform.user.findUnique({ where: { id: 'user-rahul-001' } });
  const otherFirmAdmin = otherFirm
    ? await platform.user.findFirst({ where: { firmId: otherFirm.id, role: 'admin' } })
    : null;

  assert('fixture firm exists', Boolean(firm), firm && `leadTime=${firm.minimumTaskLeadTimeDays}`);
  assert('fixture users exist', Boolean(lead && staffA && staffB && otherStaff));

  const leadCtx = { userId: lead.id, firmId: firm.id, role: 'team_lead' };
  const staffACtx = { userId: staffA.id, firmId: firm.id, role: 'staff' };
  const otherStaffCtx = { userId: otherStaff.id, firmId: firm.id, role: 'staff' };
  const otherFirmCtx = otherFirmAdmin
    ? { userId: otherFirmAdmin.id, firmId: otherFirm.id, role: 'admin' }
    : null;

  const startDate = new Date('2026-06-01T00:00:00.000Z');
  const expectedEndDate = new Date('2027-03-31T00:00:00.000Z');

  const singleProject = await createProject(
    firm.id,
    `${PREFIX}-single`,
    lead.id,
    [staffA.id],
    startDate,
    expectedEndDate
  );
  const multiProject = await createProject(
    firm.id,
    `${PREFIX}-multi`,
    lead.id,
    [staffA.id, staffB.id],
    startDate,
    expectedEndDate
  );

  const taskA = await createTask(firm.id, singleProject.id, `${PREFIX}-A`, lead.id);
  const taskB = await createTask(firm.id, multiProject.id, `${PREFIX}-B`, lead.id);
  const taskC = await createTask(firm.id, multiProject.id, `${PREFIX}-C`, lead.id);
  const taskD = await createTask(firm.id, multiProject.id, `${PREFIX}-D`, lead.id);
  const taskE = await createTask(firm.id, multiProject.id, `${PREFIX}-E`, lead.id);
  const taskF = await createTask(firm.id, singleProject.id, `${PREFIX}-F`, lead.id);
  const taskWorkflow = await createTask(firm.id, singleProject.id, `${PREFIX}-workflow`, lead.id);
  const taskSec = await createTask(firm.id, multiProject.id, `${PREFIX}-sec`, lead.id);

  // TEST A
  const assignedA = await TaskService.assignActiveTask(leadCtx, taskA.id, null);
  const freshA = await platform.task.findUnique({ where: { id: taskA.id } });
  const projA = await platform.project.findUnique({ where: { id: singleProject.id } });
  record(
    'TEST A single staff + no due date assigns',
    assignedA.status === 'assigned' && assignedA.assigneeId === staffA.id && assignedA.dueDate === null && freshA.dueDate === null,
    `assigneeId=${freshA.assigneeId} dueDate=${freshA.dueDate} status=${freshA.status}`
  );
  record('TEST A no 1970 dueDate', !isEpoch1970(freshA.dueDate));
  record(
    'TEST A project dates unchanged',
    new Date(projA.startDate).getTime() === startDate.getTime() &&
      new Date(projA.expectedEndDate).getTime() === expectedEndDate.getTime()
  );
  record('TEST A startedAt remains null', freshA.startedAt === null);

  // TEST B
  const assignedB = await TaskService.assignActiveTask(leadCtx, taskB.id, null, staffB.id);
  const freshB = await platform.task.findUnique({ where: { id: taskB.id } });
  record(
    'TEST B multi staff + selected staff + no due date',
    assignedB.status === 'assigned' && assignedB.assigneeId === staffB.id && freshB.dueDate === null,
    `assigneeId=${freshB.assigneeId} dueDate=${freshB.dueDate}`
  );

  // TEST C
  const validDue = daysFromNow(10);
  const assignedC = await TaskService.assignActiveTask(leadCtx, taskC.id, validDue, staffA.id);
  const freshC = await platform.task.findUnique({ where: { id: taskC.id } });
  record(
    'TEST C multi staff + selected staff + valid due date',
    assignedC.status === 'assigned' && assignedC.assigneeId === staffA.id && freshC.dueDate !== null,
    `dueDate=${freshC.dueDate && freshC.dueDate.toISOString()}`
  );

  // TEST D
  try {
    await TaskService.assignActiveTask(leadCtx, taskD.id, new Date('not-a-date'), staffA.id);
    record('TEST D invalid due date rejected', false, 'service accepted invalid date');
  } catch (e) {
    const msg = e.message || String(e);
    record('TEST D invalid due date rejected', /invalid/i.test(msg), msg);
  }
  const freshD = await platform.task.findUnique({ where: { id: taskD.id } });
  record('TEST D task unchanged after invalid date', freshD.status === 'active' && freshD.dueDate === null);

  // TEST E
  const tooSoon = daysFromNow(1);
  let leadTimeError = '';
  try {
    await TaskService.assignActiveTask(leadCtx, taskE.id, tooSoon, staffA.id);
    record('TEST E lead-time protection still runs', false, 'accepted too-soon due date');
  } catch (e) {
    leadTimeError = e.message || String(e);
    record(
      'TEST E lead-time protection still runs',
      /lead time/i.test(leadTimeError),
      leadTimeError
    );
  }

  const override = await TaskService.assignTaskWithOverride(leadCtx, {
    firmId: firm.id,
    taskId: taskE.id,
    assigneeId: staffA.id,
    requestedDueDate: tooSoon,
    requiredLeadTimeDays: firm.minimumTaskLeadTimeDays,
    actualLeadTimeDays: 1,
    reason: 'Verification override for assignment regression',
  });
  const overrideRow = await platform.taskAssignmentOverride.findFirst({
    where: { taskId: taskE.id },
  });
  record(
    'TEST E override workflow intact',
    Boolean(override && overrideRow && overrideRow.reason.includes('Verification override')),
    overrideRow ? `overrideId=${overrideRow.id}` : 'no override row'
  );

  // TEST F
  let leadTimeRanWithoutDue = false;
  try {
    await TaskService.assignActiveTask(leadCtx, taskF.id, null);
  } catch (e) {
    if (/lead time/i.test(e.message || '')) leadTimeRanWithoutDue = true;
    throw e;
  }
  const freshF = await platform.task.findUnique({ where: { id: taskF.id } });
  record(
    'TEST F no due date skips lead-time validation',
    !leadTimeRanWithoutDue && freshF.status === 'assigned' && freshF.dueDate === null
  );

  // Workflow
  const assignedW = await TaskService.assignActiveTask(leadCtx, taskWorkflow.id, null);
  const startedW = await TaskService.startTask(staffACtx, taskWorkflow.id);
  const afterStart = await platform.task.findUnique({ where: { id: taskWorkflow.id } });
  const submittedW = await TaskService.submitTaskForReview(staffACtx, taskWorkflow.id);
  const revisedW = await TaskService.requestTaskRevisionSequence(
    leadCtx,
    taskWorkflow.id,
    'Need one more drawing note',
    daysFromNow(12)
  );
  const restartedW = await TaskService.startTask(staffACtx, taskWorkflow.id);
  const resubmittedW = await TaskService.submitTaskForReview(staffACtx, taskWorkflow.id);
  const completedW = await TaskService.approveTaskSequence(leadCtx, taskWorkflow.id);
  const finalW = await platform.task.findUnique({
    where: { id: taskWorkflow.id },
    include: { reviewCycles: true },
  });
  const projW = await platform.project.findUnique({ where: { id: singleProject.id } });

  record(
    'WORKFLOW assigned -> in_progress -> submitted -> revision -> completed',
    assignedW.status === 'assigned' &&
      startedW.status === 'in_progress' &&
      submittedW.status === 'submitted_for_review' &&
      revisedW.status === 'revision_requested' &&
      restartedW.status === 'in_progress' &&
      resubmittedW.status === 'submitted_for_review' &&
      completedW.status === 'completed' &&
      finalW.status === 'completed',
    `final=${finalW.status} cycles=${finalW.reviewCycles.length}`
  );
  record(
    'WORKFLOW startedAt set only on start',
    assignedW.startedAt == null && afterStart.startedAt instanceof Date && finalW.startedAt instanceof Date
  );
  record(
    'WORKFLOW project dates isolated',
    new Date(projW.startDate).getTime() === startDate.getTime() &&
      new Date(projW.expectedEndDate).getTime() === expectedEndDate.getTime()
  );
  record('WORKFLOW revision cycles persisted', finalW.reviewCycles.length >= 2);

  // Security
  try {
    await TaskService.assignActiveTask(staffACtx, taskSec.id, null, staffA.id);
    record('SECURITY staff cannot assign', false, 'staff assignment succeeded');
  } catch (e) {
    record('SECURITY staff cannot assign', /unauthor/i.test(e.message || ''), e.message);
  }

  try {
    await TaskService.assignActiveTask(otherStaffCtx, taskSec.id, null, staffA.id);
    record('SECURITY non-lead cannot assign', false, 'non-lead assignment succeeded');
  } catch (e) {
    record('SECURITY non-lead cannot assign', /unauthor/i.test(e.message || ''), e.message);
  }

  if (otherFirmCtx) {
    try {
      const leaked = await TaskService.assignActiveTask(otherFirmCtx, taskSec.id, null, staffA.id);
      record('SECURITY tenant isolation on assign', false, `cross-tenant assigned ${leaked && leaked.id}`);
    } catch (e) {
      record(
        'SECURITY tenant isolation on assign',
        /unauthor|not found|row level security|RLS/i.test(e.message || String(e)),
        e.message
      );
    }
  } else {
    record('SECURITY tenant isolation on assign', false, 'no other-firm admin fixture');
  }

  try {
    await TaskService.startTask(otherStaffCtx, taskWorkflow.id);
    record('SECURITY staff cannot start another assignee task', false, 'cross-assignee start succeeded');
  } catch (e) {
    record(
      'SECURITY staff cannot start another assignee task',
      /unauthor|cannot be started/i.test(e.message || ''),
      e.message
    );
  }

  try {
    await TaskService.assignTaskWithOverride(staffACtx, {
      firmId: firm.id,
      taskId: taskSec.id,
      assigneeId: staffA.id,
      requestedDueDate: daysFromNow(1),
      requiredLeadTimeDays: firm.minimumTaskLeadTimeDays,
      actualLeadTimeDays: 1,
      reason: 'should fail',
    });
    record('SECURITY override restricted to team lead', false, 'staff override succeeded');
  } catch (e) {
    record('SECURITY override restricted to team lead', /team lead|unauthor/i.test(e.message || ''), e.message);
  }

  // HTTP / 422
  const port = await findLiveServer();
  if (!port) {
    record('HTTP server available', false, 'no listener on 3000-3002; start server for HTTP 422 check');
  } else {
    record('HTTP server available', true, `port ${port}`);
    try {
      const login = await fetchAPI('127.0.0.1', port, '/api/auth/login', 'POST', {
        email: 'priya@coastaldesign.in',
        password: 'archos@2024',
      });
      record('HTTP team lead login', login.status === 200 && Boolean(login.cookie), `status=${login.status}`);

      const httpTask = await createTask(firm.id, multiProject.id, `${PREFIX}-http-invalid`, lead.id);
      const invalidRes = await fetchAPI(
        '127.0.0.1',
        port,
        `/api/v1/tasks/${httpTask.id}/assign`,
        'POST',
        { dueDate: 'not-a-date', assigneeId: staffA.id },
        login.cookie
      );
      record(
        'TEST D HTTP invalid due date is 422 JSON',
        invalidRes.status === 422 &&
          invalidRes.isJson &&
          !/Server Components/i.test(invalidRes.raw) &&
          !/html/i.test(invalidRes.contentType),
        `status=${invalidRes.status} json=${invalidRes.isJson} type=${invalidRes.contentType} body=${typeof invalidRes.data === 'object' ? JSON.stringify(invalidRes.data) : invalidRes.raw.slice(0, 180)}`
      );

      const httpNullTask = await createTask(firm.id, singleProject.id, `${PREFIX}-http-null`, lead.id);
      const nullRes = await fetchAPI(
        '127.0.0.1',
        port,
        `/api/v1/tasks/${httpNullTask.id}/assign`,
        'POST',
        { dueDate: null },
        login.cookie
      );
      const httpFresh = await platform.task.findUnique({ where: { id: httpNullTask.id } });
      record(
        'HTTP TEST A assign with null dueDate',
        nullRes.status === 200 &&
          nullRes.isJson &&
          httpFresh.assigneeId === staffA.id &&
          httpFresh.dueDate === null,
        `status=${nullRes.status} assignee=${httpFresh.assigneeId} dueDate=${httpFresh.dueDate}`
      );

      const leadTimeTask = await createTask(firm.id, multiProject.id, `${PREFIX}-http-lead`, lead.id);
      const leadRes = await fetchAPI(
        '127.0.0.1',
        port,
        `/api/v1/tasks/${leadTimeTask.id}/assign`,
        'POST',
        { dueDate: daysFromNow(1).toISOString(), assigneeId: staffA.id },
        login.cookie
      );
      record(
        'HTTP TEST E lead-time is 422 JSON',
        leadRes.status === 422 && leadRes.isJson && !/Server Components/i.test(leadRes.raw),
        `status=${leadRes.status} body=${typeof leadRes.data === 'object' ? JSON.stringify(leadRes.data) : leadRes.raw.slice(0, 180)}`
      );
    } catch (e) {
      record('HTTP assignment flow', false, e.message);
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log('\n--- SUMMARY ---');
  console.log(`passed=${results.filter((r) => r.ok).length} failed=${failed.length}`);
  if (failed.length) {
    for (const f of failed) console.log('  FAIL', f.name, f.detail || '');
    process.exitCode = 1;
  }
}

run()
  .catch((e) => {
    console.error('RUNTIME ERROR', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cleanup();
    } catch (e) {
      console.error('CLEANUP ERROR', e.message);
    }
    await platform.$disconnect();
  });
