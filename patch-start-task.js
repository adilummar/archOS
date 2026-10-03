const fs = require('fs');

const file = 'src/services/task.service.ts';
let content = fs.readFileSync(file, 'utf-8');

// Fix 1: Make startDate immutable in startTask
content = content.replace(
  /data: \{ status: 'in_progress', startDate: new Date\(\) \}/,
  `data: { status: 'in_progress', startDate: task.startDate || new Date() }`
);

fs.writeFileSync(file, content);
console.log('Patched startTask to make startDate immutable.');
