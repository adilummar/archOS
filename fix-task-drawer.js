const fs = require('fs');

const file = 'src/components/drawers/TaskDrawer.tsx';
let content = fs.readFileSync(file, 'utf-8');

if (!content.includes('import { useTasks')) {
    content = content.replace('import { useUpdateTask', 'import { useTasks, useUpdateTask');
}

// Replace useTaskStore usage
content = content.replace(/const tasks = useTaskStore\(\(s\) => s\.tasks\);/g, 'const { data: tasks = [] } = useTasks(firmId);');
content = content.replace(/const updateTaskLocal = useTaskStore\(\(s\) => s\.updateTask\);\n/g, '');

// Remove all updateTaskLocal calls
content = content.replace(/updateTaskLocal\(.*?\);\n/g, '');

fs.writeFileSync(file, content);
