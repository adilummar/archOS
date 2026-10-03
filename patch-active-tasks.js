const fs = require('fs');

const file = 'src/services/task.service.ts';
let content = fs.readFileSync(file, 'utf-8');

const oldQ = `status: { in: ['active', 'todo'] }`;
const newQ = `status: { in: ['active', 'assigned', 'in_progress', 'revision_requested'] }`;

content = content.replace(oldQ, newQ);
fs.writeFileSync(file, content);
console.log('Patched getTeamLeadActiveTasks');
