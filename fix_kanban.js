const fs = require('fs');

const replacement = `const KANBAN_COLUMNS = [
  { id: "future", label: "Future", color: "var(--color-text-muted)" },
  { id: "active", label: "Active", color: "var(--color-info)" },
  { id: "assigned", label: "Assigned", color: "var(--color-info)" },
  { id: "todo", label: "To Do", color: "var(--color-text-muted)" },
  { id: "in_progress", label: "In Progress", color: "var(--color-info)" },
  { id: "review", label: "Review", color: "var(--color-warning)" },
  { id: "submitted_for_review", label: "Submitted for Review", color: "var(--color-warning)" },
  { id: "revision_requested", label: "Revision Requested", color: "var(--color-destructive)" },
  { id: "approved", label: "Approved", color: "var(--color-success)" },
  { id: "done", label: "Done", color: "var(--color-success)" },
  { id: "completed", label: "Completed", color: "var(--color-success)" },
  { id: "blocked", label: "Blocked", color: "var(--color-destructive)" },
] as const;`;

const files = [
  'src/components/project/TasksTab.tsx',
  'src/app/[firmSlug]/(app)/tasks/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const KANBAN_COLUMNS = \[\s*\{ id: "todo"[\s\S]*?\] as const;/g, replacement);
  fs.writeFileSync(file, content, 'utf8');
});

console.log('Fixed Kanban columns');
