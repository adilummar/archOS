const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/(app)/tasks/page.tsx', 'utf8');

c = c.replace(/const STATUS_OPTIONS[\s\S]*?\];/, `const STATUS_OPTIONS: { value: "all" | TaskStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "future", label: "Future" },
  { value: "active", label: "Active" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "submitted_for_review", label: "Review" },
  { value: "revision_requested", label: "Revision Req" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
];`);

c = c.replace(/const KANBAN_COLUMNS[\s\S]*?\];/, `const KANBAN_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "future", label: "Future", color: "var(--color-text-muted)" },
  { id: "active", label: "Active", color: "var(--color-warning)" },
  { id: "assigned", label: "Assigned", color: "var(--color-info, #3b82f6)" },
  { id: "in_progress", label: "In Progress", color: "var(--color-info, #3b82f6)" },
  { id: "submitted_for_review", label: "Review", color: "var(--color-warning)" },
  { id: "revision_requested", label: "Revision Req", color: "var(--color-destructive)" },
  { id: "completed", label: "Completed", color: "var(--color-success)" },
  { id: "blocked", label: "Blocked", color: "var(--color-destructive)" },
];`);

fs.writeFileSync('src/app/[firmSlug]/(app)/tasks/page.tsx', c);
