const fs = require('fs');

// 1. TaskDrawer.tsx
let td = fs.readFileSync('src/components/drawers/TaskDrawer.tsx', 'utf8');
td = td.replace(/{ value: "todo", label: "To Do" },\s*{ value: "in_progress", label: "In Progress" },\s*{ value: "review", label: "Review" },\s*{ value: "approved", label: "Approved" },\s*{ value: "done", label: "Done" },\s*{ value: "blocked", label: "Blocked" },/,
  `{ value: "future", label: "Future" },
            { value: "active", label: "Active" },
            { value: "assigned", label: "Assigned" },
            { value: "in_progress", label: "In Progress" },
            { value: "submitted_for_review", label: "Review" },
            { value: "revision_requested", label: "Revision Requested" },
            { value: "completed", label: "Completed" },
            { value: "blocked", label: "Blocked" },`);
fs.writeFileSync('src/components/drawers/TaskDrawer.tsx', td);

// 2. TasksTab.tsx
let tt = fs.readFileSync('src/components/project/TasksTab.tsx', 'utf8');
tt = tt.replace(/const KANBAN_COLUMNS = \[[\s\S]*?\];/, `const KANBAN_COLUMNS = [
  { id: "future", label: "Future", color: "var(--color-text-muted)" },
  { id: "active", label: "Active", color: "var(--color-warning)" },
  { id: "assigned", label: "Assigned", color: "var(--color-info, #3b82f6)" },
  { id: "in_progress", label: "In Progress", color: "var(--color-info, #3b82f6)" },
  { id: "submitted_for_review", label: "Review", color: "var(--color-warning)" },
  { id: "revision_requested", label: "Revision Req", color: "var(--color-destructive)" },
  { id: "completed", label: "Completed", color: "var(--color-success)" },
  { id: "blocked", label: "Blocked", color: "var(--color-destructive)" },
];`);
fs.writeFileSync('src/components/project/TasksTab.tsx', tt);

// 3. StatusBadge.tsx (fix type)
let sb = fs.readFileSync('src/components/shared/StatusBadge.tsx', 'utf8');
sb = sb.replace(/\| "todo" \| "in_progress" \| "review" \| "approved" \| "done" \| "blocked"/,
  '| "future" | "active" | "assigned" | "in_progress" | "submitted_for_review" | "revision_requested" | "completed" | "blocked"');
fs.writeFileSync('src/components/shared/StatusBadge.tsx', sb);

// 4. project.store.ts
let ps = fs.readFileSync('src/lib/store/project.store.ts', 'utf8');
ps = ps.replace(/status: "todo",/g, 'status: "future",');
fs.writeFileSync('src/lib/store/project.store.ts', ps);

// 5. DBProvider.tsx
let db = fs.readFileSync('src/components/providers/DBProvider.tsx', 'utf8');
db = db.replace(/status: t.status as "todo" \| "in_progress" \| "review" \| "approved" \| "done" \| "blocked",/,
  'status: t.status as "future" | "active" | "assigned" | "in_progress" | "submitted_for_review" | "revision_requested" | "completed" | "blocked",');
fs.writeFileSync('src/components/providers/DBProvider.tsx', db);

// 6. task.store.ts
let ts = fs.readFileSync('src/lib/store/task.store.ts', 'utf8');
ts = ts.replace(/status: input.status \?\? "todo",/, 'status: input.status ?? "future",');
fs.writeFileSync('src/lib/store/task.store.ts', ts);

// 7. staff page
let sp = fs.readFileSync('src/app/[firmSlug]/(app)/staff/[staffId]/page.tsx', 'utf8');
sp = sp.replace(/t.status === "todo"/, 't.status === "assigned"');
fs.writeFileSync('src/app/[firmSlug]/(app)/staff/[staffId]/page.tsx', sp);

console.log('Patched all todo references');
