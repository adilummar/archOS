const fs = require('fs');

function deprecateActions(file) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/export async function/g, '/** @deprecated Migrated to TanStack Query */\nexport async function');
  fs.writeFileSync(file, content);
}

deprecateActions('src/app/actions/task.actions.ts');
deprecateActions('src/app/actions/staff.actions.ts');
deprecateActions('src/app/actions/attendance.actions.ts');
