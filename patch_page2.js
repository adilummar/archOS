const fs = require('fs');
let p = fs.readFileSync('src/app/[firmSlug]/(app)/tasks/page.tsx', 'utf8');

p = p.replace(
  'import { useTaskStore, projectCompletion } from "@/lib/store/task.store";',
  'import { useTaskStore, projectCompletion } from "@/lib/store/task.store";\nimport { useTasks, useUpdateTask } from "@/hooks/useTasks";'
);

const oldVars = "const { tasks, setTaskStatus } = useTaskStore();\n  const { projects } = useProjectStore();\n  const { user, firm } = useAuthStore();";

const newVars = "const { projects } = useProjectStore();\n  const { user, firm } = useAuthStore();\n  const { tasks: uiTasks, setTaskStatus: uiSetTaskStatus } = useTaskStore();\n  const { data: tasks = [] } = useTasks(firm?.id || \"\");\n  const updateTask = useUpdateTask(firm?.id || \"\", user?.id || \"\");\n  const setTaskStatus = (taskId: string, status: any) => updateTask.mutate({ taskId, data: { status } });";

p = p.replace(oldVars, newVars);

fs.writeFileSync('src/app/[firmSlug]/(app)/tasks/page.tsx', p);
