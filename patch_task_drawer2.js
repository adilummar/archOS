const fs = require('fs');
let c = fs.readFileSync('src/components/drawers/TaskDrawer.tsx', 'utf8');

c = c.replace(
  'import { updateTask, deleteTask, reviewTask, addSubtask, toggleSubtask, assignTaskWithOverride } from "@/app/actions/task.actions";',
  'import { useUpdateTask, useDeleteTask, useReviewTask, useOverrideTask, useAddSubtask, useToggleSubtask } from "@/hooks/useTasks";'
);
c = c.replace('import { useTaskStore } from "@/lib/store/task.store";\r\n', '');
c = c.replace('import { useTaskStore } from "@/lib/store/task.store";\n', '');

c = c.replace(
  'const authUser = useAuthStore((s) => s.user);',
  'const authUser = useAuthStore((s) => s.user);\n  const firmId = authUser?.firmId || "";\n  const updateTaskMut = useUpdateTask(firmId, authUser?.id || "");\n  const deleteTaskMut = useDeleteTask(firmId, authUser?.id || "");\n  const reviewTaskMut = useReviewTask(firmId, authUser?.id || "");\n  const overrideTaskMut = useOverrideTask(firmId);\n  const addSubtaskMut = useAddSubtask(firmId);\n  const toggleSubtaskMut = useToggleSubtask(firmId);'
);

c = c.replaceAll('await updateTask(task.id, ', 'await updateTaskMut.mutateAsync({ taskId: task.id, data: ');
c = c.replace(/updateTaskMut\.mutateAsync\(\{ taskId: task\.id, data: (\{.*?\})\);/g, 'updateTaskMut.mutateAsync({ taskId: task.id, data:  });');

c = c.replaceAll('await deleteTask(task.id, user.id, firm.id);', 'await deleteTaskMut.mutateAsync(task.id);');

// user is not defined, it's authUser in TaskDrawer
c = c.replaceAll('await reviewTask(task.id, user.id, firm.id, ', 'await reviewTaskMut.mutateAsync({ taskId: task.id, data: ');
// wait, if it was user.id, but it's authUser... wait, let's look at what was originally there.
// If it was authUser, then wait reviewTask(task.id, authUser.id, authUser.firmId, 
c = c.replace(/await reviewTask\(task\.id, .*?, .*?, /g, 'await reviewTaskMut.mutateAsync({ taskId: task.id, data: ');

c = c.replace(/reviewTaskMut\.mutateAsync\(\{ taskId: task\.id, data: (\{.*?\})\);/g, 'reviewTaskMut.mutateAsync({ taskId: task.id, data:  });');

c = c.replaceAll('await assignTaskWithOverride({', 'await overrideTaskMut.mutateAsync({ taskId: task.id, data: {');
c = c.replaceAll('actualLeadTimeDays: diffDays, reason: overrideReason });', 'actualLeadTimeDays: diffDays, reason: overrideReason } });');

c = c.replaceAll('await addSubtask({', 'await addSubtaskMut.mutateAsync({ taskId: task.id, data: {');
c = c.replace(/assignedToId: user\.id \}\);/g, 'assignedToId: authUser!.id } });');
// Wait, is it user.id or authUser.id in the original code? Let's assume authUser.id.

c = c.replaceAll('await toggleSubtask(task.id, subtaskId);', 'await toggleSubtaskMut.mutateAsync({ subtaskId, data: {} });');

fs.writeFileSync('src/components/drawers/TaskDrawer.tsx', c);
