const fs = require('fs');

// 1. TasksTab.tsx
let tt = fs.readFileSync('src/components/project/TasksTab.tsx', 'utf8');
tt = tt.replace(/const KANBAN_COLUMNS: \{ id: TaskStatus; label: string; color: string \}?\[\] = \[[\s\S]*?\];/m, `const KANBAN_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
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

// 2. StatusBadge.tsx
let sb = fs.readFileSync('src/components/shared/StatusBadge.tsx', 'utf8');
sb = sb.replace(/^  todo:\s*\{.*\},/m, '  future: { label: "Future", color: "var(--color-text-muted)", bg: "rgb(107 107 112 / 0.12)" },\n  active: { label: "Active", color: "var(--color-warning)", bg: "var(--color-warning-muted)" },\n  assigned: { label: "Assigned", color: "var(--color-info)", bg: "var(--color-info-muted)" },');
sb = sb.replace(/^  review:\s*\{.*\},/m, '  submitted_for_review: { label: "Review", color: "var(--color-warning)", bg: "var(--color-warning-muted)" },\n  revision_requested: { label: "Revision", color: "var(--color-destructive)", bg: "var(--color-destructive-muted)" },');
sb = sb.replace(/^  done:\s*\{.*\},/m, '  completed: { label: "Completed", color: "var(--color-success)", bg: "var(--color-success-muted)" },');
sb = sb.replace(/^  approved:\s*\{.*\},/m, '');
sb = sb.replace(/\| "todo" \| "in_progress" \| "review" \| "approved" \| "done" \| "blocked"/, '| "future" | "active" | "assigned" | "in_progress" | "submitted_for_review" | "revision_requested" | "completed" | "blocked"');
fs.writeFileSync('src/components/shared/StatusBadge.tsx', sb);
