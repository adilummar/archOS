const fs = require('fs');

const file = 'src/services/attendance.service.ts';
let content = fs.readFileSync(file, 'utf-8');

const regex = /const authSession = await getSession\(\);/;

const injection = `const authSession = await getSession();
          if (!data.taskId || !data.projectId) {
            throw new Error("A task and project must be selected to check in.");
          }`;

content = content.replace(regex, injection);
fs.writeFileSync(file, content);
console.log('Patched checkIn in attendance.service.ts');
