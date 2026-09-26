const fs = require('fs');

let c = fs.readFileSync('src/components/drawers/NewTaskDrawer.tsx', 'utf8');

c = c.replace(/const \{ user, firm \} = useAuthStore\(\);/, 'const { user, firm } = useAuthStore();\n  const createTask = useCreateTask(firm?.id || "");\n  const overrideTask = useOverrideTask(firm?.id || "");');

fs.writeFileSync('src/components/drawers/NewTaskDrawer.tsx', c);

let c2 = fs.readFileSync('src/components/drawers/TaskDrawer.tsx', 'utf8');

c2 = c2.replace(/import \{ useTaskStore \} from "@\/lib\/store\/task\.store";/g, '');
c2 = c2.replace(/import \{\s*updateTask,\s*deleteTask,\s*reviewTask,\s*addSubtask,\s*toggleSubtask,\s*assignTaskWithOverride\s*\} from "@\/app\/actions\/task\.actions";/g, 'import { useUpdateTask, useDeleteTask, useReviewTask, useOverrideTask } from "@/hooks/useTasks";\nimport { addSubtask as addSubtaskApi, toggleSubtask as toggleSubtaskApi } from "@/lib/api-client";');

c2 = c2.replace(/const authUser = useAuthStore\(\(s\) => s\.user\);/, 'const authUser = useAuthStore((s) => s.user);\n  const updateTaskMut = useUpdateTask(firm?.id || "", authUser?.id || "");\n  const deleteTaskMut = useDeleteTask(firm?.id || "", authUser?.id || "");\n  const reviewTaskMut = useReviewTask(firm?.id || "", authUser?.id || "");\n  const overrideTaskMut = useOverrideTask(firm?.id || "");');

c2 = c2.replace(/await updateTask\(task\.id, /g, 'await updateTaskMut.mutateAsync({ taskId: task.id, data: ');
// Replace all end of updateTask call from ); to }); by matching updateTaskMut.mutateAsync
c2 = c2.replace(/updateTaskMut\.mutateAsync\(\{ taskId: task\.id, data: ([\s\S]*?)\);/g, 'updateTaskMut.mutateAsync({ taskId: task.id, data: });');

c2 = c2.replace(/await deleteTask\(task\.id, /g, 'await deleteTaskMut.mutateAsync(task.id'); // wait, deleteTask doesn't have an object for arguments! useDeleteTask just takes taskId
c2 = c2.replace(/await reviewTask\(task\.id, user\.id, firm\.id, /g, 'await reviewTaskMut.mutateAsync({ taskId: task.id, data: ');
c2 = c2.replace(/reviewTaskMut\.mutateAsync\(\{ taskId: task\.id, data: ([\s\S]*?)\);/g, 'reviewTaskMut.mutateAsync({ taskId: task.id, data: });');
c2 = c2.replace(/await assignTaskWithOverride\(\{/g, 'await overrideTaskMut.mutateAsync({ taskId: task.id, data: {');
c2 = c2.replace(/actualLeadTimeDays: diffDays,\s*reason: overrideReason\s*\}\);/g, 'actualLeadTimeDays: diffDays, reason: overrideReason } });');
c2 = c2.replace(/await addSubtask\(\{/g, 'await addSubtaskApi({');
c2 = c2.replace(/await toggleSubtask\(/g, 'await toggleSubtaskApi(');

fs.writeFileSync('src/components/drawers/TaskDrawer.tsx', c2);

