const fs = require('fs');
let c = fs.readFileSync('src/components/drawers/TaskDrawer.tsx', 'utf8');

c = c.replace(/const updateTask = useTaskStore\(\(s\) => s\.updateTask\);\r?\n?/, '');
c = c.replace(/const setTaskStatus = useTaskStore\(\(s\) => s\.setTaskStatus\);\r?\n?/, '');
c = c.replace(/const toggleSubtask = useTaskStore\(\(s\) => s\.toggleSubtask\);\r?\n?/, '');
c = c.replace(/const addSubtask = useTaskStore\(\(s\) => s\.addSubtask\);\r?\n?/, '');
c = c.replace(/const setTaskApproval = useTaskStore\(\(s\) => s\.setTaskApproval\);\r?\n?/, '');
c = c.replace(/const reassignTask = useTaskStore\(\(s\) => s\.reassignTask\);\r?\n?/, '');

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
