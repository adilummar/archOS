const fs = require('fs');

function replaceInFile(path) {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  
  // Replace direct string comparisons
  code = code.replace(/===\s*"todo"/g, '=== "future"');
  code = code.replace(/!==\s*"todo"/g, '!== "future"');
  code = code.replace(/===\s*"done"/g, '=== "completed"');
  code = code.replace(/!==\s*"done"/g, '!== "completed"');
  code = code.replace(/===\s*"review"/g, '=== "submitted_for_review"');
  code = code.replace(/!==\s*"review"/g, '!== "submitted_for_review"');
  code = code.replace(/===\s*"approved"/g, '=== "completed"');
  code = code.replace(/!==\s*"approved"/g, '!== "completed"');

  // Replace assignments
  code = code.replace(/status:\s*"todo"/g, 'status: "future"');
  code = code.replace(/status:\s*"review"/g, 'status: "submitted_for_review"');
  code = code.replace(/status:\s*"done"/g, 'status: "completed"');
  code = code.replace(/status:\s*"approved"/g, 'status: "completed"');
  
  code = code.replace(/status:\s*'todo'/g, 'status: "future"');
  code = code.replace(/status:\s*'review'/g, 'status: "submitted_for_review"');
  code = code.replace(/status:\s*'done'/g, 'status: "completed"');

  fs.writeFileSync(path, code);
}

replaceInFile('src/app/[firmSlug]/(app)/dashboard/page.tsx');
replaceInFile('src/app/[firmSlug]/(app)/projects/[projectId]/page.tsx');
replaceInFile('src/app/[firmSlug]/(app)/projects/page.tsx');
replaceInFile('src/app/[firmSlug]/(app)/tasks/page.tsx');
replaceInFile('src/components/drawers/TaskDrawer.tsx');
replaceInFile('src/components/project/TasksTab.tsx');
replaceInFile('src/lib/store/task.store.ts');
replaceInFile('src/lib/demo/seed.ts');
