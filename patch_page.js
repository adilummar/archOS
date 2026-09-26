const fs = require('fs');
let p = fs.readFileSync('src/app/[firmSlug]/(app)/tasks/page.tsx', 'utf8');

p = p.replace(
  'import { useTaskStore, projectCompletion } from "@/lib/store/task.store";',
  'import { useTaskStore, projectCompletion } from "@/lib/store/task.store";\nimport { useTasks, useUpdateTask } from "@/hooks/useTasks";'
);

p = p.replace(
  'const { tasks, setTaskStatus } = useTaskStore();',
  'const { tasks: uiTasks, setTaskStatus: uiSetTaskStatus } = useTaskStore();\n  const { data: tasks = [] } = useTasks(firm?.id || "");\n  const updateTask = useUpdateTask(firm?.id || "", user?.id || "");\n  const setTaskStatus = (taskId: string, status: any) => updateTask.mutate({ taskId, data: { status } });'
);

// We need to pass firm and user first before calling useTasks if we want to avoid irm being used before initialized!
// Wait, const { user, firm } = useAuthStore(); is below const { tasks, setTaskStatus } = useTaskStore();.
// Let's swap the order in the replace!

// Re-read file to discard bad replacements
p = fs.readFileSync('src/app/[firmSlug]/(app)/tasks/page.tsx', 'utf8');
p = p.replace(
  'import { useTaskStore, projectCompletion } from "@/lib/store/task.store";',
  'import { useTaskStore, projectCompletion } from "@/lib/store/task.store";\nimport { useTasks, useUpdateTask } from "@/hooks/useTasks";'
);

const oldVars = const { tasks, setTaskStatus } = useTaskStore();
  const { projects } = useProjectStore();
  const { user, firm } = useAuthStore();;

const newVars = const { projects } = useProjectStore();
  const { user, firm } = useAuthStore();
  const { tasks: uiTasks, setTaskStatus: uiSetTaskStatus } = useTaskStore();
  const { data: tasks = [] } = useTasks(firm?.id || "");
  const updateTask = useUpdateTask(firm?.id || "", user?.id || "");
  const setTaskStatus = (taskId: string, status: any) => updateTask.mutate({ taskId, data: { status } });;

p = p.replace(oldVars, newVars);

fs.writeFileSync('src/app/[firmSlug]/(app)/tasks/page.tsx', p);

