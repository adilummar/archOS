const fs = require('fs');
let c = fs.readFileSync('src/components/drawers/TaskDrawer.tsx', 'utf8');

c = c.replace(/toggleSubtask\(task\.id, st\.id\)/g, 'toggleSubtaskMut.mutateAsync({ subtaskId: st.id, data: {} })');

fs.writeFileSync('src/components/drawers/TaskDrawer.tsx', c);
