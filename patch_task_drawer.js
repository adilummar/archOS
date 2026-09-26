const fs = require('fs');
let c = fs.readFileSync('src/components/drawers/TaskDrawer.tsx', 'utf8');

// Replace imports
c = c.replace(
  'import { updateTask, deleteTask, reviewTask, addSubtask, toggleSubtask, assignTaskWithOverride } from "@/app/actions/task.actions";',
  'import { useUpdateTask, useDeleteTask, useReviewTask, useOverrideTask, useAddSubtask, useToggleSubtask } from "@/hooks/useTasks";'
);
c = c.replace('import { useTaskStore } from "@/lib/store/task.store";\r\n', '');
c = c.replace('import { useTaskStore } from "@/lib/store/task.store";\n', '');

// Inject hooks
c = c.replace(
  'const { user, firm } = useAuthStore();',
  'const { user, firm } = useAuthStore();\n  const updateTaskMut = useUpdateTask(firm?.id || "", user?.id || "");\n  const deleteTaskMut = useDeleteTask(firm?.id || "", user?.id || "");\n  const reviewTaskMut = useReviewTask(firm?.id || "", user?.id || "");\n  const overrideTaskMut = useOverrideTask(firm?.id || "");\n  const addSubtaskMut = useAddSubtask(firm?.id || "");\n  const toggleSubtaskMut = useToggleSubtask(firm?.id || "");'
);

// Replace actions
c = c.replaceAll('await updateTask(task.id, ', 'await updateTaskMut.mutateAsync({ taskId: task.id, data: ');
// Close updateTask parenthesis payload - it always ended with ); inside TaskDrawer.
// To be safe, let's target the exact expressions.
// There are multiple calls to updateTask:
// await updateTask(task.id, { title: editTitle });
// await updateTask(task.id, { description: editDesc });
// await updateTask(task.id, { dueDate });
c = c.replace(/updateTaskMut\.mutateAsync\(\{ taskId: task\.id, data: (\{.*?\})\);/g, 'updateTaskMut.mutateAsync({ taskId: task.id, data:  });');

c = c.replaceAll('await deleteTask(task.id, user.id, firm.id);', 'await deleteTaskMut.mutateAsync(task.id);');

c = c.replaceAll('await reviewTask(task.id, user.id, firm.id, ', 'await reviewTaskMut.mutateAsync({ taskId: task.id, data: ');
c = c.replace(/reviewTaskMut\.mutateAsync\(\{ taskId: task\.id, data: (\{.*?\})\);/g, 'reviewTaskMut.mutateAsync({ taskId: task.id, data:  });');

c = c.replaceAll('await assignTaskWithOverride({', 'await overrideTaskMut.mutateAsync({ taskId: task.id, data: {');
c = c.replaceAll('actualLeadTimeDays: diffDays, reason: overrideReason });', 'actualLeadTimeDays: diffDays, reason: overrideReason } });');

c = c.replaceAll('await addSubtask({', 'await addSubtaskMut.mutateAsync({ taskId: task.id, data: {');
c = c.replaceAll('assignedToId: user.id });', 'assignedToId: user.id } });');

c = c.replaceAll('await toggleSubtask(task.id, subtaskId);', 'await toggleSubtaskMut.mutateAsync({ subtaskId, data: {} });');

fs.writeFileSync('src/components/drawers/TaskDrawer.tsx', c);
