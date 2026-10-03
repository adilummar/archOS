const fs = require('fs');

function dedupe(file) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Extract all lines
  let lines = content.split('\n');
  let newLines = [];
  let tasksFound = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.includes('const { data: tasks = [] } = useTasks(')) {
      if (tasksFound) {
        // Skip duplicate
        continue;
      } else {
        tasksFound = true;
        // make sure it uses firm?.id for dashboard
        if (file.includes('dashboard')) line = '  const { data: tasks = [] } = useTasks(firm?.id || "");';
        if (file.includes('CommandPalette')) line = '  const { data: tasks = [] } = useTasks(firm?.id || "");';
        if (file.includes('projects/page.tsx')) line = '  const { data: tasks = [] } = useTasks(firm?.id || "");';
        if (file.includes('projects/[projectId]')) line = '  const { data: tasks = [] } = useTasks(firm?.id || "");';
        if (file.includes('staff/page.tsx')) line = '  const { data: tasks = [] } = useTasks(firm?.id || "");';
        if (file.includes('TaskDrawer')) line = '  const { data: tasks = [] } = useTasks(firmId);';
        
        newLines.push(line);
      }
    } else if (line.includes('const { data: tasks = [], isLoading, error } = useTasks(')) {
       if (tasksFound) continue;
       tasksFound = true;
       newLines.push(line);
    } else if (line.includes('const updateTaskMut = useUpdateTask(')) {
       if (file.includes('TasksTab') || file.includes('tasks/page.tsx')) {
         // Keep first one
         if (!newLines.some(l => l.includes('updateTaskMut = useUpdateTask'))) {
            newLines.push(line);
         }
       } else {
         newLines.push(line);
       }
    } else {
      newLines.push(line);
    }
  }
  
  fs.writeFileSync(file, newLines.join('\n'));
}

dedupe('src/app/[firmSlug]/(app)/dashboard/page.tsx');
dedupe('src/app/[firmSlug]/(app)/projects/[projectId]/page.tsx');
dedupe('src/app/[firmSlug]/(app)/projects/page.tsx');
dedupe('src/app/[firmSlug]/(app)/staff/page.tsx');
dedupe('src/app/[firmSlug]/(app)/tasks/page.tsx');
dedupe('src/components/drawers/TaskDrawer.tsx');
dedupe('src/components/project/TasksTab.tsx');
dedupe('src/components/shared/CommandPalette.tsx');
