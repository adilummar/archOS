const fs = require('fs');
const file = 'src/components/providers/DBProvider.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace project store hydration - full replace instead of merge
const oldProject = `        useProjectStore.setState((projectState) => {
          for (const p of zustandProjects) {
            const idx = projectState.projects.findIndex((x) => x.id === p.id);
            if (idx === -1) {
              projectState.projects.push(p);
            } else {
              projectState.projects[idx] = { ...projectState.projects[idx], ...p };
            }
          }
        });`;

const newProject = `        // ── Full replace — clears deleted projects from persisted localStorage cache ──
        useProjectStore.setState((projectState) => {
          projectState.projects = projectState.projects.filter(p => p.firmId !== firm.id);
          projectState.projects.push(...zustandProjects);
        });`;

// Replace task store hydration - full replace instead of merge  
const oldTask = `        useTaskStore.setState((taskState) => {
          for (const t of zustandTasks) {
            const idx = taskState.tasks.findIndex((x) => x.id === t.id);
            if (idx === -1) {
              taskState.tasks.push(t);
            } else {
              taskState.tasks[idx] = { ...taskState.tasks[idx], ...t };
            }
          }
        });`;

const newTask = `        // ── Full replace — clears deleted tasks from persisted localStorage cache ──
        useTaskStore.setState((taskState) => {
          taskState.tasks = taskState.tasks.filter(t => t.firmId !== firm.id);
          taskState.tasks.push(...zustandTasks);
        });`;

let changed = 0;
if (content.includes(oldProject)) {
  content = content.replace(oldProject, newProject);
  changed++;
  console.log('✅ Fixed project store hydration');
} else {
  // Try normalizing CRLF
  const normalized = content.replace(/\r\n/g, '\n');
  const oldNorm = oldProject.replace(/\r\n/g, '\n');
  if (normalized.includes(oldNorm)) {
    content = normalized.replace(oldNorm, newProject.replace(/\r\n/g, '\n'));
    changed++;
    console.log('✅ Fixed project store hydration (normalized)');
  } else {
    console.log('❌ Could not find project store merge block');
  }
}

if (content.includes(oldTask) || content.replace(/\r\n/g, '\n').includes(oldTask.replace(/\r\n/g, '\n'))) {
  const c = content.replace(/\r\n/g, '\n');
  const o = oldTask.replace(/\r\n/g, '\n');
  content = c.replace(o, newTask.replace(/\r\n/g, '\n'));
  changed++;
  console.log('✅ Fixed task store hydration');
} else {
  console.log('❌ Could not find task store merge block');
}

if (changed > 0) {
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Saved ${changed} fixes to DBProvider.tsx`);
}
