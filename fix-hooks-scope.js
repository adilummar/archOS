const fs = require('fs');

function moveHooksDown(file) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Dashboard
  if (file.includes('dashboard')) {
    content = content.replace(/const \{ data: tasks = \[\] \} = useTasks\(firm\?\.id \|\| firmId \|\| ""\);\n/g, '');
    content = content.replace(/(const \{ user, firm \} = useAuthStore\(\);)/, '$1\n  const { data: tasks = [] } = useTasks(firm?.id || "");');
  }
  
  // Projects Detail
  if (file.includes('projects/[projectId]')) {
    content = content.replace(/const \{ data: tasks = \[\] \} = useTasks\(firm\?\.id \|\| firmId \|\| ""\);\n/g, '');
    content = content.replace(/(const \{ firm \} = useAuthStore\(\);)/, '$1\n  const { data: tasks = [] } = useTasks(firm?.id || "");');
  }
  
  // Projects
  if (file.includes('projects/page.tsx')) {
    content = content.replace(/const \{ data: tasks = \[\] \} = useTasks\(firm\?\.id \|\| firmId \|\| ""\);\n/g, '');
    content = content.replace(/(const \{ user, firm \} = useAuthStore\(\);)/, '$1\n  const { data: tasks = [] } = useTasks(firm?.id || "");');
  }
  
  // Staff
  if (file.includes('staff')) {
    content = content.replace(/const \{ data: tasks = \[\] \} = useTasks\(firm\?\.id \|\| firmId \|\| ""\);\n/g, '');
    content = content.replace(/(const \{ user, firm \} = useAuthStore\(\);)/, '$1\n  const { data: tasks = [] } = useTasks(firm?.id || "");');
  }
  
  // Tasks
  if (file.includes('tasks/page.tsx')) {
    content = content.replace(/const \{ data: tasks = \[\], isLoading, error \} = useTasks\(firm\?\.id \|\| ""\);\n  const updateTaskMut = useUpdateTask\(firm\?\.id \|\| "", user\?\.id \|\| ""\);\n/g, '');
    content = content.replace(/(const \{ user, firm \} = useAuthStore\(\);)/, '$1\n  const { data: tasks = [], isLoading, error } = useTasks(firm?.id || "");\n  const updateTaskMut = useUpdateTask(firm?.id || "", user?.id || "");');
    
    // Fix setLoading and loading
    content = content.replace(/const \[loading, setLoading\] = useState\(true\);\n/g, ''); // just in case it was re-added
    content = content.replace(/setLoading\(true\);/g, '');
    content = content.replace(/setLoading\(false\);/g, '');
    content = content.replace(/loading \? \(/g, 'isLoading ? (');
    content = content.replace(/if \(loading\)/g, 'if (isLoading)');
  }
  
  // TaskDrawer
  if (file.includes('TaskDrawer')) {
    content = content.replace(/const assignTaskMut = useAssignTaskSequence\(firmId\);\n    const startTaskMut = useStartTaskSequence\(firmId\);\n    const submitReviewMut = useSubmitTaskForReviewSequence\(firmId\);\n    const approveTaskMut = useApproveTaskSequence\(firmId\);\n    const requestRevisionMut = useRequestTaskRevisionSequence\(firmId\);/g, '');
    content = content.replace(/(const firmId = authUser\?\.firmId \|\| "";)/, '$1\n  const assignTaskMut = useAssignTaskSequence(firmId);\n  const startTaskMut = useStartTaskSequence(firmId);\n  const submitReviewMut = useSubmitTaskForReviewSequence(firmId);\n  const approveTaskMut = useApproveTaskSequence(firmId);\n  const requestRevisionMut = useRequestTaskRevisionSequence(firmId);');
    
    // Fix firmId used before declaration
    content = content.replace(/const \{ data: tasks = \[\] \} = useTasks\(firmId\);\n/g, '');
    content = content.replace(/(const firmId = authUser\?\.firmId \|\| "";)/, '$1\n  const { data: tasks = [] } = useTasks(firmId);');
  }
  
  // TasksTab
  if (file.includes('TasksTab')) {
    content = content.replace(/const \{ data: tasks = \[\] \} = useTasks\(project\.firmId\);\n  const updateTaskMut = useUpdateTask\(project\.firmId, user\?\.id \|\| ""\);\n/g, '');
    content = content.replace(/(const \{ user \} = useAuthStore\(\);)/, '$1\n  const { data: tasks = [] } = useTasks(project.firmId);\n  const updateTaskMut = useUpdateTask(project.firmId, user?.id || "");');
  }
  
  // CommandPalette
  if (file.includes('CommandPalette')) {
    content = content.replace(/const \{ data: tasks = \[\] \} = useTasks\(firm\?\.id \|\| firmId \|\| ""\);\n/g, '');
    content = content.replace(/(const \{ user, firm \} = useAuthStore\(\);)/, '$1\n  const { data: tasks = [] } = useTasks(firm?.id || "");');
  }
  
  fs.writeFileSync(file, content);
}

moveHooksDown('src/app/[firmSlug]/(app)/dashboard/page.tsx');
moveHooksDown('src/app/[firmSlug]/(app)/projects/[projectId]/page.tsx');
moveHooksDown('src/app/[firmSlug]/(app)/projects/page.tsx');
moveHooksDown('src/app/[firmSlug]/(app)/staff/page.tsx');
moveHooksDown('src/app/[firmSlug]/(app)/tasks/page.tsx');
moveHooksDown('src/components/drawers/TaskDrawer.tsx');
moveHooksDown('src/components/project/TasksTab.tsx');
moveHooksDown('src/components/shared/CommandPalette.tsx');
