const fs = require('fs');

const file = 'src/services/task.service.ts';
let content = fs.readFileSync(file, 'utf-8');

// I'll replace `startDate: task.startDate || new Date()` with `startedAt: task.startedAt || new Date()`
content = content.replace(
  /startDate: task\.startDate \|\| new Date\(\)/,
  `startedAt: task.startedAt || new Date()`
);

fs.writeFileSync(file, content);
console.log('Patched startTask to use startedAt.');
