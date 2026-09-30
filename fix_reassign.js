const fs = require('fs');
let code = fs.readFileSync('src/components/drawers/TaskDrawer.tsx', 'utf8');

// Fix handleReassign - just set pendingAssigneeId instead of immediately firing
const marker = 'const handleReassign = (assigneeId: string) => {';
const idx = code.indexOf(marker);
if (idx === -1) { console.log('marker not found'); process.exit(1); }

// Find the closing brace of handleReassign
const blockStart = code.indexOf('{', idx);
let depth = 0, pos = blockStart;
while (pos < code.length) {
  if (code[pos] === '{') depth++;
  else if (code[pos] === '}') { depth--; if (depth === 0) break; }
  pos++;
}

const oldBlock = code.slice(idx, pos + 1);
const newBlock = `const handleReassign = (assigneeId: string) => {
    // Store as pending — saved when Apply Changes is clicked
    setPendingAssigneeId(assigneeId);
  }`;

code = code.slice(0, idx) + newBlock + code.slice(pos + 1);
console.log('handleReassign replaced');

// Now fix handleApply to include pendingAssigneeId in the patch
const applyMarker = "if (pendingPriority !== null) patch.priority = pendingPriority;";
if (code.includes(applyMarker)) {
  code = code.replace(
    applyMarker,
    `if (pendingPriority !== null) patch.priority = pendingPriority;\r\n    if (pendingAssigneeId !== null) patch.assigneeId = pendingAssigneeId;`
  );
  console.log('handleApply patch fixed');
} else {
  console.log('handleApply marker not found');
}

// Also reset pendingAssigneeId after apply
const resetMarker = "setPendingPriority(null);";
if (code.includes(resetMarker)) {
  code = code.replace(
    resetMarker,
    `setPendingPriority(null);\r\n      setPendingAssigneeId(null);`
  );
  console.log('reset fixed');
}

// Fix the ReassignControl to show the pending selection
// currentAssigneeId={task.assigneeId} -> currentAssigneeId={pendingAssigneeId ?? task.assigneeId}
code = code.replace(
  'currentAssigneeId={task.assigneeId}',
  'currentAssigneeId={pendingAssigneeId ?? task.assigneeId}'
);
console.log('ReassignControl updated');

fs.writeFileSync('src/components/drawers/TaskDrawer.tsx', code);
console.log('All done!');
