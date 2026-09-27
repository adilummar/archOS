const fs = require('fs');

const file1 = 'src/components/project/TasksTab.tsx';
let c1 = fs.readFileSync(file1, 'utf8');
c1 = c1.replace(/task.status !== "done" && task.status !== "approved"/g, 'task.status !== "completed" && task.status !== "done" && task.status !== "approved"');
fs.writeFileSync(file1, c1, 'utf8');

const file2 = 'src/app/[firmSlug]/(app)/tasks/page.tsx';
let c2 = fs.readFileSync(file2, 'utf8');
c2 = c2.replace(/!\["done", "approved"\]/g, '!["completed", "done", "approved"]');
fs.writeFileSync(file2, c2, 'utf8');

console.log('Fixed overdue status checks');
