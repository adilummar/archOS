const fs = require('fs');
let code = fs.readFileSync('src/lib/store/types.ts', 'utf8');
code = code.replace(/export type TaskStatus =.*/, "export type TaskStatus = 'future' | 'active' | 'assigned' | 'in_progress' | 'submitted_for_review' | 'revision_requested' | 'completed' | 'blocked' | 'todo' | 'done' | 'review' | 'approved'");
fs.writeFileSync('src/lib/store/types.ts', code);
