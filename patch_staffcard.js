const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/(app)/staff/page.tsx', 'utf8');

// 1. Update StaffGroup signature to accept admin callbacks
c = c.replace(
  `// ── STAFF GROUP ───────────────────────────────────────────────────────────────
function StaffGroup({
  title, color, members, firmSlug, projects, tasks, router, viewMode
}: {
  title: string;
  color: string;
  members: StaffWithAttendance;
  firmSlug: string;
  projects: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string }>;
  router: ReturnType<typeof useRouter>;
  viewMode: "grid" | "list";
}) {`,
  `// ── STAFF GROUP ───────────────────────────────────────────────────────────────
function StaffGroup({
  title, color, members, firmSlug, projects, tasks, router, viewMode, isAdmin, onSuspend, onChangePassword
}: {
  title: string;
  color: string;
  members: StaffWithAttendance;
  firmSlug: string;
  projects: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string }>;
  router: ReturnType<typeof useRouter>;
  viewMode: "grid" | "list";
  isAdmin?: boolean;
  onSuspend?: (m: { id: string; name: string; status: string }) => void;
  onChangePassword?: (m: { id: string; name: string }) => void;
}) {`
);

// 2. Update StaffCard call inside StaffGroup to pass down callbacks
c = c.replace(
  `        {members.map((s) => (
          <StaffCard
            key={s.id}
            staff={s}
            firmSlug={firmSlug}
            projects={projects}
            tasks={tasks}
            onClick={() => router.push(\`/\${firmSlug}/staff/\${s.id}\`)}
            viewMode={viewMode}
          />
        ))}`,
  `        {members.map((s) => (
          <StaffCard
            key={s.id}
            staff={s}
            firmSlug={firmSlug}
            projects={projects}
            tasks={tasks}
            onClick={() => router.push(\`/\${firmSlug}/staff/\${s.id}\`)}
            viewMode={viewMode}
            isAdmin={isAdmin}
            onSuspend={onSuspend}
            onChangePassword={onChangePassword}
          />
        ))}`
);

// 3. Update StaffCard signature to accept admin callbacks
c = c.replace(
  `// ── STAFF CARD ────────────────────────────────────────────────────────────────
function StaffCard({
  staff, firmSlug, projects, tasks, onClick, viewMode
}: {
  staff: StaffWithAttendance[0];
  firmSlug: string;
  projects: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string }>;
  onClick: () => void;
  viewMode?: "grid" | "list";
}) {`,
  `// ── STAFF CARD ────────────────────────────────────────────────────────────────
function StaffCard({
  staff, firmSlug, projects, tasks, onClick, viewMode, isAdmin, onSuspend, onChangePassword
}: {
  staff: StaffWithAttendance[0];
  firmSlug: string;
  projects: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string }>;
  onClick: () => void;
  viewMode?: "grid" | "list";
  isAdmin?: boolean;
  onSuspend?: (m: { id: string; name: string; status: string }) => void;
  onChangePassword?: (m: { id: string; name: string }) => void;
}) {`
);

// 4. Update StaffGroup calls in StaffPage to pass admin props
const groups = ['Working Now', 'On Break', 'Checked Out', 'Not Checked In'];
for (const g of groups) {
  c = c.replace(
    `<StaffGroup title="${g}"`,
    `<StaffGroup title="${g}" isAdmin={isAdmin} onSuspend={setShowSuspendModal} onChangePassword={setShowPasswordModal}`
  );
}

fs.writeFileSync('src/app/[firmSlug]/(app)/staff/page.tsx', c);
console.log('Done');
console.log('Has isAdmin prop in StaffCard:', c.includes('isAdmin?: boolean'));
