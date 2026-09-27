const fs = require('fs');
const filePath = 'src/app/[firmSlug]/(app)/tasks/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const implicitCheck = `    const checkImplicit = (t: Task) => {
      if (t.assigneeId === user.id) return true;
      if (!t.assigneeId) {
        const p = projects.find(proj => proj.id === t.projectId);
        if (p && p.staffIds.length === 1 && p.staffIds[0] === user.id && t.stageId === p.currentStageId) return true;
      }
      return false;
    };`;

const implicitReplacement = `    const checkImplicit = (t: Task) => {
      if (t.assigneeId === user.id) return true;
      return false;
    };`;

if (content.includes(implicitCheck)) {
  content = content.replace(implicitCheck, implicitReplacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Fixed implicit check in TasksPage");
} else {
  console.log("Could not find implicit check in TasksPage");
}
