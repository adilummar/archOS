const fs = require('fs');
let c = fs.readFileSync('src/components/drawers/NewTaskDrawer.tsx', 'utf8');

c = c.replace(
  'import { createTask, assignTaskWithOverride } from "@/app/actions/task.actions";',
  'import { useCreateTask, useOverrideTask } from "@/hooks/useTasks";'
);
c = c.replace('import { useTaskStore } from "@/lib/store/task.store";\r\n', '');
c = c.replace('import { useTaskStore } from "@/lib/store/task.store";\n', '');

c = c.replace(
  'const { user, firm } = useAuthStore();',
  'const { user, firm } = useAuthStore();\n  const createTaskMut = useCreateTask(firm?.id || "");\n  const overrideTaskMut = useOverrideTask(firm?.id || "");'
);

c = c.replaceAll('await createTask({', 'await createTaskMut.mutateAsync({');

c = c.replaceAll('await assignTaskWithOverride({', 'await overrideTaskMut.mutateAsync({ taskId: newTask.id, data: {');

// Fix closing tag for override payload
// It was: actualLeadTimeDays: diffDays, reason: overrideReason });
c = c.replaceAll('actualLeadTimeDays: diffDays, reason: overrideReason });', 'actualLeadTimeDays: diffDays, reason: overrideReason } });');

fs.writeFileSync('src/components/drawers/NewTaskDrawer.tsx', c);
