const fs = require('fs');
const file = 'src/app/[firmSlug]/(app)/tasks/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace firmProjects definition
const firmProjectsRegex = /const firmProjects = useMemo\([\s\S]*?\(\) => projects\.filter\(\(p\) => p\.firmId === firm\?\.id\),[\s\S]*?\[projects, firm\][\s\S]*?\);/;
const firmProjectsReplacement = `const firmProjects = useMemo(
    () => projects.filter((p) => p.firmId === firm?.id && p.status === "active"),
    [projects, firm]
  );`;

if (firmProjectsRegex.test(content)) {
  content = content.replace(firmProjectsRegex, firmProjectsReplacement);
  console.log('Replaced firmProjects');
} else {
  console.log('Failed firmProjects');
}

// Replace filteredTasks definition
const filteredTasksRegex = /const filteredTasks = useMemo\(\(\) => \{\s*if \(\!firm \|\| \!user\) return \[\];\s*let result = tasks\.filter\(\(t\) => t\.firmId === firm\.id\);/;
const filteredTasksReplacement = `const filteredTasks = useMemo(() => {
    if (!firm || !user) return [];
    
    // Only show tasks for active projects on this global view
    const activeProjectIds = new Set(firmProjects.map(p => p.id));
    let result = tasks.filter((t) => t.firmId === firm.id && activeProjectIds.has(t.projectId));`;

if (filteredTasksRegex.test(content)) {
  content = content.replace(filteredTasksRegex, filteredTasksReplacement);
  console.log('Replaced filteredTasks');
} else {
  console.log('Failed filteredTasks');
}

fs.writeFileSync(file, content, 'utf8');
