const http = require("http");

const HOST = "localhost";
const PORT = 3000;
const PASS = "archos@2024";

function fetchAPI(path, method = "GET", body = null, cookie = null) {
  const dataStr = body ? JSON.stringify(body) : "";
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers.Cookie = cookie;
  if (dataStr) headers["Content-Length"] = Buffer.byteLength(dataStr);

  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: HOST, port: PORT, path, method, headers },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed = data;
          try {
            parsed = JSON.parse(data);
          } catch {}
          const setCookie = res.headers["set-cookie"]
            ? res.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ")
            : cookie;
          resolve({ status: res.statusCode, data: parsed, cookie: setCookie, raw: data });
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(20000, () => {
      req.destroy(new Error("timeout"));
    });
    if (dataStr) req.write(dataStr);
    req.end();
  });
}

async function login(email, password = PASS) {
  const res = await fetchAPI("/api/auth/login", "POST", { email, password });
  if (res.status !== 200) {
    throw new Error(`login failed ${email} ${res.status} ${JSON.stringify(res.data)}`);
  }
  return res;
}

function record(results, name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? " — " + detail : ""}`);
}

function staffIds(project, teamLeadId) {
  const members = project.staffMembers || [];
  const ids = members.map((sm) => sm.userId || sm.user?.id).filter(Boolean);
  return ids.filter((id) => id !== teamLeadId && id !== project.teamLeadId);
}

async function createTodoTask(adminCookie, firmId, project, assignerId) {
  const payload = {
    firmId,
    projectId: project.id,
    title: "WF-AUDIT " + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
    status: "todo",
    priority: "high",
    assignerId,
    assigneeId: assignerId,
  };
  if (project.stages && project.stages[0]) payload.stageId = project.stages[0].id;
  const res = await fetchAPI("/api/v1/tasks", "POST", payload, adminCookie);
  const task = res.data?.data || res.data;
  return { res, task };
}

async function run() {
  const results = [];

  const admin = await login("adil@coastaldesign.in");
  const tl = await login("priya@coastaldesign.in");
  const staffRahul = await login("rahul@coastaldesign.in");
  let staffAnanya;
  try {
    staffAnanya = await login("ananya@coastaldesign.in");
  } catch {
    staffAnanya = await login("ananya@coastaldesign.in", "ananya@coastaldesign.in");
  }

  const meAdmin = await fetchAPI("/api/auth/me", "GET", null, admin.cookie);
  const meTl = await fetchAPI("/api/auth/me", "GET", null, tl.cookie);
  const meRahul = await fetchAPI("/api/auth/me", "GET", null, staffRahul.cookie);
  const meAnanya = await fetchAPI("/api/auth/me", "GET", null, staffAnanya.cookie);

  const firmId = meAdmin.data.user?.firmId || meAdmin.data.firm?.id || "firm-coastal-001";
  const adminId = meAdmin.data.user.id;
  const tlId = meTl.data.user.id;
  const rahulId = meRahul.data.user.id;
  const ananyaId = meAnanya.data.user.id;

  const projectsRes = await fetchAPI(`/api/v1/projects?firmId=${firmId}`, "GET", null, admin.cookie);
  const projects = Array.isArray(projectsRes.data) ? projectsRes.data : projectsRes.data?.data || [];
  const mapped = projects.map((p) => ({
    id: p.id,
    name: p.name,
    teamLeadId: p.teamLeadId,
    staff: staffIds(p, p.teamLeadId),
    stages: p.stages || [],
    raw: p,
  }));

  const multi = mapped.find((p) => p.staff.length >= 2 && (p.teamLeadId === tlId || true));
  const single = mapped.find((p) => p.staff.length === 1);
  const multiForTl = mapped.find((p) => p.staff.length >= 2 && p.teamLeadId === tlId) || multi;

  console.log("SETUP projects", mapped.map((p) => ({ id: p.id, name: p.name, tl: p.teamLeadId, staff: p.staff.length })));
  console.log("users", { firmId, adminId, tlId, rahulId, ananyaId });

  if (!multiForTl) throw new Error("No multi-staff project found");

  // TEST 1 — create a one-staff project, assign with NULL dueDate (auto-pick)
  const createdProj = await fetchAPI(
    "/api/v1/projects",
    "POST",
    {
      firmId,
      name: "WF-AUDIT single-staff " + Date.now(),
      teamLeadId: tlId,
      staffIds: [ananyaId],
      location: "Audit",
    },
    admin.cookie
  );
  const singleProj = createdProj.data?.data || createdProj.data;
  if (createdProj.status >= 400 || !singleProj?.id) {
    record(results, "TEST 1 Single Staff + NULL dueDate", false, `project create HTTP ${createdProj.status} ${JSON.stringify(createdProj.data)}`);
  } else {
    const { res: c1, task: t1 } = await createTodoTask(admin.cookie, firmId, singleProj, adminId);
    if (!t1?.id) {
      record(results, "TEST 1 Single Staff + NULL dueDate", false, JSON.stringify(c1.data));
    } else {
      const assign = await fetchAPI(
        `/api/v1/tasks/${t1.id}/assign?firmId=${firmId}`,
        "POST",
        { dueDate: null, priority: "high" },
        tl.cookie
      );
      const ok =
        assign.status === 200 &&
        assign.data.assigneeId === ananyaId &&
        assign.data.dueDate == null &&
        assign.data.status === "assigned";
      record(
        results,
        "TEST 1 Single Staff + NULL dueDate",
        ok,
        `HTTP ${assign.status} assignee=${assign.data?.assigneeId} due=${assign.data?.dueDate} status=${assign.data?.status}`
      );
    }
  }

  // TEST 2 — multiple staff + selected + NULL dueDate
  const { res: c2, task: t2 } = await createTodoTask(admin.cookie, firmId, multiForTl.raw, adminId);
  const assign2 = await fetchAPI(
    `/api/v1/tasks/${t2.id}/assign?firmId=${firmId}`,
    "POST",
    { assigneeId: ananyaId, dueDate: null, priority: "high" },
    tl.cookie
  );
  record(
    results,
    "TEST 2 Multiple Staff + selected + NULL dueDate",
    assign2.status === 200 && assign2.data.assigneeId === ananyaId && assign2.data.dueDate == null,
    `HTTP ${assign2.status} assignee=${assign2.data?.assigneeId} due=${assign2.data?.dueDate} err=${assign2.data?.error || ""}`
  );

  // TEST 3 — multiple staff + selected + valid dueDate
  const { task: t3 } = await createTodoTask(admin.cookie, firmId, multiForTl.raw, adminId);
  const assign3 = await fetchAPI(
    `/api/v1/tasks/${t3.id}/assign?firmId=${firmId}`,
    "POST",
    { assigneeId: ananyaId, dueDate: "2026-10-29", priority: "high" },
    tl.cookie
  );
  const due3 = assign3.data?.dueDate ? new Date(assign3.data.dueDate).toISOString().slice(0, 10) : null;
  record(
    results,
    "TEST 3 Multiple Staff + selected + valid dueDate",
    assign3.status === 200 && assign3.data.assigneeId === ananyaId && due3 === "2026-10-29",
    `HTTP ${assign3.status} assignee=${assign3.data?.assigneeId} due=${assign3.data?.dueDate}`
  );

  // TEST 4 — invalid dueDate → 422
  const { task: t4 } = await createTodoTask(admin.cookie, firmId, multiForTl.raw, adminId);
  const assign4 = await fetchAPI(
    `/api/v1/tasks/${t4.id}/assign?firmId=${firmId}`,
    "POST",
    { assigneeId: ananyaId, dueDate: "not-a-date", priority: "high" },
    tl.cookie
  );
  record(
    results,
    "TEST 4 Invalid dueDate",
    assign4.status === 422 && assign4.status !== 500,
    `HTTP ${assign4.status} body=${JSON.stringify(assign4.data)}`
  );

  // TEST 5 — lead time violation
  const { task: t5 } = await createTodoTask(admin.cookie, firmId, multiForTl.raw, adminId);
  const assign5 = await fetchAPI(
    `/api/v1/tasks/${t5.id}/assign?firmId=${firmId}`,
    "POST",
    { assigneeId: ananyaId, dueDate: new Date().toISOString().slice(0, 10), priority: "high" },
    tl.cookie
  );
  record(
    results,
    "TEST 5 Due date violates minimum lead time",
    assign5.status === 422 && String(assign5.data?.error || "").toLowerCase().includes("lead time"),
    `HTTP ${assign5.status} body=${JSON.stringify(assign5.data)}`
  );

  // TEST 6 — no due date skips lead time
  record(
    results,
    "TEST 6 No due date skips lead-time check",
    assign2.status === 200 && assign2.data.dueDate == null,
    `reuse TEST 2 HTTP ${assign2.status} due=${assign2.data?.dueDate}`
  );

  // TEST 7 — unauthorized staff assignment
  const { task: t7 } = await createTodoTask(admin.cookie, firmId, multiForTl.raw, adminId);
  const assign7 = await fetchAPI(
    `/api/v1/tasks/${t7.id}/assign?firmId=${firmId}`,
    "POST",
    { assigneeId: rahulId, dueDate: null },
    staffRahul.cookie
  );
  record(
    results,
    "TEST 7 Unauthorized Staff assignment",
    assign7.status === 403,
    `HTTP ${assign7.status} body=${JSON.stringify(assign7.data)}`
  );

  // TEST 8 — cross-tenant: foreign firm session cannot assign coastal task
  let foreignCookie = null;
  const saAttempts = [
    { email: "super@archos.com", password: PASS, path: "/api/auth/super-admin/login" },
    { email: "adil@elscore.com", password: "platform_secret_admin", path: "/api/auth/super-admin/login" },
  ];
  let sa = null;
  for (const attempt of saAttempts) {
    const res = await fetchAPI(attempt.path, "POST", { email: attempt.email, password: attempt.password });
    if (res.status === 200) {
      sa = res;
      break;
    }
  }
  if (sa) {
    const emailB = `wf-audit-b-${Date.now()}@tenant-b.test`;
    const firmBRes = await fetchAPI(
      "/api/v1/platform/firms",
      "POST",
      { name: "WF Tenant B " + Date.now(), adminName: "Admin B", adminEmail: emailB, adminPassword: "Password123" },
      sa.cookie
    );
    const firmBId = firmBRes.data?.id || firmBRes.data?.data?.id;
    const passB = firmBRes.data?._tempAdminPassword || firmBRes.data?.data?._tempAdminPassword || "Password123";
    if (firmBId) {
      await fetchAPI(
        `/api/v1/platform/firms/${firmBId}/features`,
        "PATCH",
        { features: ["PROJECTS", "TASKS", "ATTENDANCE", "STAFF"] },
        sa.cookie
      );
    }
    const foreign = await fetchAPI("/api/auth/login", "POST", { email: emailB, password: passB });
    if (foreign.status === 200) foreignCookie = foreign.cookie;
  }
  if (!foreignCookie) {
    record(results, "TEST 8 Cross-tenant assignment", false, "could not create/login foreign tenant");
  } else {
    const assign8 = await fetchAPI(
      `/api/v1/tasks/${t3.id}/assign?firmId=${firmId}`,
      "POST",
      { assigneeId: ananyaId, dueDate: "2026-10-29" },
      foreignCookie
    );
    const blocked = assign8.status === 403 || assign8.status === 404 || assign8.status === 422;
    record(
      results,
      "TEST 8 Cross-tenant assignment",
      blocked && assign8.status !== 200,
      `HTTP ${assign8.status} body=${JSON.stringify(assign8.data)}`
    );
  }

  // TEST 9 — start assigned task
  const start9 = await fetchAPI(`/api/v1/tasks/${t3.id}/start?firmId=${firmId}`, "POST", {}, staffAnanya.cookie);
  const startedAt = start9.data?.startedAt;
  record(
    results,
    "TEST 9 Start assigned task",
    start9.status === 200 && start9.data.status === "in_progress" && !!startedAt,
    `HTTP ${start9.status} status=${start9.data?.status} startedAt=${startedAt}`
  );

  const start9b = await fetchAPI(`/api/v1/tasks/${t3.id}/start?firmId=${firmId}`, "POST", {}, staffAnanya.cookie);
  record(
    results,
    "TEST 9b startedAt preserved on second start",
    start9b.status === 200 && start9b.data?.startedAt === startedAt,
    `first=${startedAt} second=${start9b.data?.startedAt}`
  );

  // TEST 10 — give for review
  const sub10 = await fetchAPI(`/api/v1/tasks/${t3.id}/submit-review?firmId=${firmId}`, "POST", {}, staffAnanya.cookie);
  record(
    results,
    "TEST 10 Give for Review",
    sub10.status === 200 && sub10.data.status === "submitted_for_review",
    `HTTP ${sub10.status} status=${sub10.data?.status}`
  );

  // TEST 12 first on a clone so TEST 11 can still accept another task
  const { task: tRev } = await createTodoTask(admin.cookie, firmId, multiForTl.raw, adminId);
  await fetchAPI(
    `/api/v1/tasks/${tRev.id}/assign?firmId=${firmId}`,
    "POST",
    { assigneeId: ananyaId, dueDate: "2026-10-29" },
    tl.cookie
  );
  await fetchAPI(`/api/v1/tasks/${tRev.id}/start?firmId=${firmId}`, "POST", {}, staffAnanya.cookie);
  await fetchAPI(`/api/v1/tasks/${tRev.id}/submit-review?firmId=${firmId}`, "POST", {}, staffAnanya.cookie);

  const rev12 = await fetchAPI(
    `/api/v1/tasks/${tRev.id}/request-revision?firmId=${firmId}`,
    "POST",
    { remark: "Please revise the north elevation" },
    tl.cookie
  );
  record(
    results,
    "TEST 12 Team Lead requests revision",
    rev12.status === 200 && rev12.data.status === "revision_requested" && rev12.data.assigneeId === ananyaId,
    `HTTP ${rev12.status} status=${rev12.data?.status} assignee=${rev12.data?.assigneeId}`
  );

  // TEST 13 staff resubmits
  const resub13 = await fetchAPI(`/api/v1/tasks/${tRev.id}/submit-review?firmId=${firmId}`, "POST", {}, staffAnanya.cookie);
  record(
    results,
    "TEST 13 Staff resubmits",
    resub13.status === 200 && resub13.data.status === "submitted_for_review",
    `HTTP ${resub13.status} status=${resub13.data?.status}`
  );

  // TEST 11 TL accepts
  const appr11 = await fetchAPI(`/api/v1/tasks/${t3.id}/approve?firmId=${firmId}`, "POST", {}, tl.cookie);
  record(
    results,
    "TEST 11 Team Lead accepts",
    appr11.status === 200 && appr11.data.status === "completed",
    `HTTP ${appr11.status} status=${appr11.data?.status}`
  );

  // TL list still returns assigned/current tasks (not only todo)
  const { task: tVis } = await createTodoTask(admin.cookie, firmId, multiForTl.raw, adminId);
  await fetchAPI(
    `/api/v1/tasks/${tVis.id}/assign?firmId=${firmId}`,
    "POST",
    { assigneeId: ananyaId, dueDate: "2026-10-29", priority: "high" },
    tl.cookie
  );
  const tlList = await fetchAPI(`/api/v1/tasks?firmId=${firmId}`, "GET", null, tl.cookie);
  const list = Array.isArray(tlList.data) ? tlList.data : [];
  const assignedVisible = list.filter((t) => t.status === "assigned");
  record(
    results,
    "TL GET includes assigned current task",
    assignedVisible.length > 0 && assignedVisible.every((t) => t.assigneeId) && assignedVisible.every((t) => Array.isArray(t.subtasks)),
    `assigned=${assignedVisible.length}/${list.length} statuses=${list.map((t) => t.status).join(",")} ids=${assignedVisible.map((t) => t.id).join(",")}`
  );

  const staffList = await fetchAPI(`/api/v1/tasks?firmId=${firmId}`, "GET", null, staffAnanya.cookie);
  const staffTasks = Array.isArray(staffList.data) ? staffList.data : [];
  const staffSees = staffTasks.find((t) => t.id === tVis.id);
  record(
    results,
    "Staff GET includes assigned task",
    !!staffSees && staffSees.assigneeId === ananyaId,
    staffSees ? `status=${staffSees.status}` : `missing from ${staffTasks.length} tasks`
  );

  const failed = results.filter((r) => !r.ok);
  console.log("\nSUMMARY", results.length - failed.length + "/" + results.length, "passed");
  if (failed.length) process.exitCode = 1;
}

run().catch((err) => {
  console.error("MATRIX FATAL", err);
  process.exit(1);
});
