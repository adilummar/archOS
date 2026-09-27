const fs = require('fs');
const file = 'src/components/providers/DBProvider.tsx';
let content = fs.readFileSync(file, 'utf8');

const projectMerge = `        useProjectStore.setState((projectState) => {
          for (const p of zustandProjects) {
            const idx = projectState.projects.findIndex((x) => x.id === p.id);
            if (idx === -1) {
              projectState.projects.push(p);
            } else {
              projectState.projects[idx] = { ...projectState.projects[idx], ...p };
            }
          }
        });`;

const projectReplace = `        useProjectStore.setState((projectState) => {
          projectState.projects = projectState.projects.filter(p => p.firmId !== firm.id);
          projectState.projects.push(...zustandProjects);
        });`;

const taskMerge = `        useTaskStore.setState((taskState) => {
          for (const t of zustandTasks) {
            const idx = taskState.tasks.findIndex((x) => x.id === t.id);
            if (idx === -1) {
              taskState.tasks.push(t);
            } else {
              taskState.tasks[idx] = { ...taskState.tasks[idx], ...t };
            }
          }
        });`;

const taskReplace = `        useTaskStore.setState((taskState) => {
          taskState.tasks = taskState.tasks.filter(t => t.firmId !== firm.id);
          taskState.tasks.push(...zustandTasks);
        });`;

if (content.includes(projectMerge)) {
  content = content.replace(projectMerge, projectReplace);
}
if (content.includes(taskMerge)) {
  content = content.replace(taskMerge, taskReplace);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed DBProvider hydration to remove deleted items.');
