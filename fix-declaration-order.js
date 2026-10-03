const fs = require('fs');

let file = 'src/components/drawers/TaskDrawer.tsx';
let content = fs.readFileSync(file, 'utf-8');

content = content.replace('  const { data: tasks = [] } = useTasks(firmId);\n  const task = tasks.find((t) => t.id === taskId);\n  const updateTaskLocal = useTaskStore((s) => s.updateTask);\n            \n  const authUser = useAuthStore((s) => s.user);\n  const firmId = authUser?.firmId || "";', '  const updateTaskLocal = useTaskStore((s) => s.updateTask);\n            \n  const authUser = useAuthStore((s) => s.user);\n  const firmId = authUser?.firmId || "";\n  const { data: tasks = [] } = useTasks(firmId);\n  const task = tasks.find((t) => t.id === taskId);');

fs.writeFileSync(file, content);

let file2 = 'src/components/project/TasksTab.tsx';
let content2 = fs.readFileSync(file2, 'utf-8');

content2 = content2.replace('  const { data: tasks = [] } = useTasks(project.firmId);\n  const updateTaskMut = useUpdateTask(project.firmId, user?.id || "");\n  const { users } = useFirmStore();\n  const { user } = useAuthStore();', '  const { users } = useFirmStore();\n  const { user } = useAuthStore();\n  const { data: tasks = [] } = useTasks(project.firmId);\n  const updateTaskMut = useUpdateTask(project.firmId, user?.id || "");');

fs.writeFileSync(file2, content2);
