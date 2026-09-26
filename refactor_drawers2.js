const fs = require('fs');

let c = fs.readFileSync('src/components/drawers/NewTaskDrawer.tsx', 'utf8');

c = c.replace(/import \{ useTaskStore \} from "@\/lib\/store\/task\.store";/g, '');
c = c.replace(/import \{ createTask, assignTaskWithOverride \} from "@\/app\/actions\/task\.actions";/g, 'import { useCreateTask, useOverrideTask } from "@/hooks/useTasks";');

c = c.replace(/const firm = useAuthStore\(\(s\) => s\.firm\);/, 'const firm = useAuthStore((s) => s.firm);\n  const createTask = useCreateTask(firm?.id || "");\n  const overrideTask = useOverrideTask(firm?.id || "");');

c = c.replace(/await createTask\(\{/g, 'await createTask.mutateAsync({');
c = c.replace(/await assignTaskWithOverride\(\{/g, 'await overrideTask.mutateAsync({ taskId: newTask.id, data: {');

c = c.replace(/actualLeadTimeDays: diffDays,\s*reason: overrideReason\s*\}\);/g, 'actualLeadTimeDays: diffDays, reason: overrideReason } });');

c = c.replace(/useTaskStore\.getState\(\)\.addTask\(\{[\s\S]*?\}\);/g, '');

fs.writeFileSync('src/components/drawers/NewTaskDrawer.tsx', c);
