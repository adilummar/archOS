const fs = require('fs');
const file = 'src/app/[firmSlug]/(app)/tasks/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// The old role-based filter block (using checkImplicit)
const oldBlock = `    const checkImplicit = (t: Task) => {
      if (t.assigneeId === user.id) return true;
      return false;
    };
    if (user.role === "staff") result = result.filter(checkImplicit);
    else if (showMyTasksOnly) result = result.filter(checkImplicit);`;

const newBlock = `    // ── Role-based task visibility ────────────────────────────────────────────
    // Team Lead: only see tasks that need THEIR action right now.
    //   - "active"               → unassigned, ready to be assigned to staff
    //   - "submitted_for_review" → staff finished, waiting for TL review/approval
    // Everything else (future, assigned, in_progress, revision_requested) is
    // handled by staff or is not yet actionable — hidden from the TL list.
    if (user.role === "team_lead") {
      result = result.filter(t =>
        t.status === "active" || t.status === "submitted_for_review"
      );
    }
    // Staff: only see tasks that are their personal responsibility right now.
    else if (user.role === "staff") {
      result = result.filter(t =>
        t.assigneeId === user.id &&
        ["assigned", "in_progress", "revision_requested"].includes(t.status)
      );
    }
    // Admin: see everything — no additional filter
    // My tasks only toggle (admin / accounts)
    else if (showMyTasksOnly) {
      result = result.filter(t => t.assigneeId === user.id);
    }`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(file, content, 'utf8');
  console.log('✅ Replaced role-based filter in filteredTasks');
} else {
  // try normalizing line endings
  const norm = content.replace(/\r\n/g, '\n');
  const normOld = oldBlock.replace(/\r\n/g, '\n');
  if (norm.includes(normOld)) {
    const result = norm.replace(normOld, newBlock);
    fs.writeFileSync(file, result, 'utf8');
    console.log('✅ Replaced (normalized)');
  } else {
    console.log('❌ Could not find block');
    // Show what is in that area for debugging
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    const idx = lines.findIndex(l => l.includes('checkImplicit'));
    console.log('Found checkImplicit at line:', idx + 1);
    console.log(lines.slice(idx - 2, idx + 8).join('\n'));
  }
}
