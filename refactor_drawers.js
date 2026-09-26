const fs = require('fs');

let c = fs.readFileSync('src/components/drawers/NewTaskDrawer.tsx', 'utf8');

// Replace imports
c = c.replace(/import \{ useTaskStore \} from "@\/lib\/store\/task\.store";/g, '');
c = c.replace(/import \{ createTask, assignTaskWithOverride \} from "@\/app\/actions\/task\.actions";/g, 'import { useCreateTask, useOverrideTask } from "@/hooks/useTasks";');

// Insert hooks at the top of the component
c = c.replace(/const firm = useAuthStore\(\(s\) => s\.firm\);/, const firm = useAuthStore((s) => s.firm);\n  const createTask = useCreateTask(firm?.id || "");\n  const overrideTask = useOverrideTask(firm?.id || ""););

// Replace action calls with mutateAsync
c = c.replace(/await createTask\(\{/g, 'await createTask.mutateAsync({');
c = c.replace(/await assignTaskWithOverride\(\{/g, 'await overrideTask.mutateAsync({ taskId: newTask.id, data: {');

// Fix override task closing brace since we wrapped in { taskId, data: { ... } }
// Actually easier to just replace 	askId: newTask.id, with nothing in the data payload, but it's fine.
c = c.replace(/actualLeadTimeDays: diffDays,\s*reason: overrideReason\s*\}\);/g, 'actualLeadTimeDays: diffDays, reason: overrideReason } });');

// Remove useTaskStore.getState().addTask(...) blocks
c = c.replace(/useTaskStore\.getState\(\)\.addTask\(\{[\s\S]*?\}\);/g, '');

fs.writeFileSync('src/components/drawers/NewTaskDrawer.tsx', c);

let c2 = fs.readFileSync('src/components/drawers/TaskDrawer.tsx', 'utf8');

c2 = c2.replace(/import \{ useTaskStore \} from "@\/lib\/store\/task\.store";/g, '');
c2 = c2.replace(/import \{\s*updateTask,\s*deleteTask,\s*reviewTask,\s*addSubtask,\s*toggleSubtask,\s*assignTaskWithOverride\s*\} from "@\/app\/actions\/task\.actions";/g, 'import { useUpdateTask, useDeleteTask, useReviewTask, useOverrideTask } from "@/hooks/useTasks";\nimport { addSubtask as addSubtaskApi, toggleSubtask as toggleSubtaskApi } from "@/lib/api-client";');

c2 = c2.replace(/const firm = useAuthStore\(\(s\) => s\.firm\);/, const firm = useAuthStore((s) => s.firm);\n  const updateTaskMut = useUpdateTask(firm?.id || "", authUser?.id || "");\n  const deleteTaskMut = useDeleteTask(firm?.id || "", authUser?.id || "");\n  const reviewTaskMut = useReviewTask(firm?.id || "", authUser?.id || "");\n  const overrideTaskMut = useOverrideTask(firm?.id || ""););

// Replace action calls
c2 = c2.replace(/await updateTask\(task\.id, /g, 'await updateTaskMut.mutateAsync({ taskId: task.id, data: ');
// Close brace for updateTask call
c2 = c2.replace(/await updateTaskMut\.mutateAsync\(\{ taskId: task\.id, data: ([\s\S]*?)\);/g, 'await updateTaskMut.mutateAsync({ taskId: task.id, data: });');
// Wait, regex might fail. Let's do simple strings.

fs.writeFileSync('src/components/drawers/TaskDrawer.tsx', c2);
