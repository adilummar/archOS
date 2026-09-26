const fs = require('fs');
let c = fs.readFileSync('src/components/drawers/TaskDrawer.tsx', 'utf8');

// Replace imports
c = c.replace(
  'import { useAuthStore } from "../../lib/store/auth.store";',
  'import { useAuthStore } from "../../lib/store/auth.store";\nimport { useUpdateTask, useDeleteTask, useReviewTask, useOverrideTask, useAddSubtask, useToggleSubtask } from "@/hooks/useTasks";'
);

// Remove store functions
c = c.replace(/const updateTask = useTaskStore\(\(s\) => s\.updateTask\);\r?\n?/, '');
c = c.replace(/const setTaskStatus = useTaskStore\(\(s\) => s\.setTaskStatus\);\r?\n?/, '');
c = c.replace(/const toggleSubtask = useTaskStore\(\(s\) => s\.toggleSubtask\);\r?\n?/, '');
c = c.replace(/const addSubtask = useTaskStore\(\(s\) => s\.addSubtask\);\r?\n?/, '');
c = c.replace(/const setTaskApproval = useTaskStore\(\(s\) => s\.setTaskApproval\);\r?\n?/, '');
c = c.replace(/const reassignTask = useTaskStore\(\(s\) => s\.reassignTask\);\r?\n?/, '');

// Add React Query mutations
c = c.replace(
  'const authUser = useAuthStore((s) => s.user);',
  'const authUser = useAuthStore((s) => s.user);\n  const firmId = authUser?.firmId || "";\n  const updateTaskMut = useUpdateTask(firmId, authUser?.id || "");\n  const deleteTaskMut = useDeleteTask(firmId, authUser?.id || "");\n  const reviewTaskMut = useReviewTask(firmId, authUser?.id || "");\n  const overrideTaskMut = useOverrideTask(firmId);\n  const addSubtaskMut = useAddSubtask(firmId);\n  const toggleSubtaskMut = useToggleSubtask(firmId);'
);

// Fix updateTask calls
c = c.replace(/updateTask\(task\.id, (\{[\s\S]*?\})\)/g, 'updateTaskMut.mutateAsync({ taskId: task.id, data:  })');

// Fix setTaskStatus
c = c.replace(/setTaskStatus\(task\.id, (.*?)\)/g, 'updateTaskMut.mutateAsync({ taskId: task.id, data: { status:  } })');

// Fix setTaskApproval
c = c.replace(/setTaskApproval\(task\.id, (.*?), (\{.*?\})\)/g, 'reviewTaskMut.mutateAsync({ taskId: task.id, data: { status: , ... } })');
c = c.replace(/setTaskApproval\(task\.id, (.*?)\)/g, 'reviewTaskMut.mutateAsync({ taskId: task.id, data: { status:  } })');

// Fix reassignTask
c = c.replace(/reassignTask\(task\.id, assigneeId\)/g, 'updateTaskMut.mutateAsync({ taskId: task.id, data: { assigneeId } })');

// Fix toggleSubtask
c = c.replace(/toggleSubtask\(task\.id, subtaskId\)/g, 'toggleSubtaskMut.mutateAsync({ subtaskId, data: {} })');

// Fix addSubtask
c = c.replace(/addSubtask\(task\.id, (\{[\s\S]*?\})\)/g, 'addSubtaskMut.mutateAsync({ taskId: task.id, data:  })');

fs.writeFileSync('src/components/drawers/TaskDrawer.tsx', c);
