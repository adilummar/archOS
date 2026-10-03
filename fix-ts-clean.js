const fs = require('fs');

const files = [
  'src/app/[firmSlug]/(app)/dashboard/page.tsx',
  'src/app/[firmSlug]/(app)/projects/[projectId]/page.tsx',
  'src/app/[firmSlug]/(app)/projects/page.tsx',
  'src/app/[firmSlug]/(app)/staff/page.tsx',
  'src/app/[firmSlug]/(app)/tasks/page.tsx',
  'src/components/drawers/TaskDrawer.tsx',
  'src/components/project/TasksTab.tsx',
  'src/components/shared/CommandPalette.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');

  // Remove ALL forms of `tasks` extraction to start clean.
  content = content.replace(/const \{ tasks \} = useTaskStore\(\);\n/g, '');
  content = content.replace(/const \{ data: tasks = \[\] \} = useTasks\([^)]+\);\n/g, '');
  content = content.replace(/const \{ data: tasks = \[\], isLoading, error \} = useTasks\([^)]+\);\n/g, '');
  content = content.replace(/const updateTaskMut = useUpdateTask\([^)]+\);\n/g, '');

  // Now, inject correctly directly after useAuthStore
  if (file.includes('tasks/page.tsx')) {
    content = content.replace(/(const \{ user, firm \} = useAuthStore\(\);)/, '$1\n  const { data: tasks = [], isLoading, error } = useTasks(firm?.id || "");\n  const updateTaskMut = useUpdateTask(firm?.id || "", user?.id || "");');
    content = content.replace(/setLoading\(true\);/g, '');
    content = content.replace(/setLoading\(false\);/g, '');
  } else if (file.includes('TasksTab.tsx')) {
    content = content.replace(/(const \{ user \} = useAuthStore\(\);)/, '$1\n  const { data: tasks = [] } = useTasks(project.firmId);\n  const updateTaskMut = useUpdateTask(project.firmId, user?.id || "");');
  } else if (file.includes('TaskDrawer.tsx')) {
    content = content.replace(/(const firmId = authUser\?\.firmId \|\| "";)/, '$1\n  const { data: tasks = [] } = useTasks(firmId);');
  } else {
    // For others
    content = content.replace(/(const \{.*?firm.*?\} = useAuthStore\(\);)/, '$1\n  const { data: tasks = [] } = useTasks(firm?.id || "");');
  }

  fs.writeFileSync(file, content);
}
