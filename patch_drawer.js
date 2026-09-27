const fs = require('fs');
let c = fs.readFileSync('src/components/drawers/TaskDrawer.tsx', 'utf8');

// Add updateTaskLocal after tasks line
c = c.replace(
  'const task = tasks.find((t) => t.id === taskId);',
  'const task = tasks.find((t) => t.id === taskId);\n  const updateTaskLocal = useTaskStore((s) => s.updateTask);'
);

// handleStatusChange: add optimistic update
c = c.replace(
  'const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {\n    const val = e.target.value as any;\n    updateTaskMut.mutateAsync({ taskId: task.id, data: { status: val } });\n    toast("Status updated", "success");\n  };',
  'const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {\n    const val = e.target.value as any;\n    updateTaskLocal(task.id, { status: val });\n    updateTaskMut.mutateAsync({ taskId: task.id, data: { status: val } });\n    toast("Status updated", "success");\n  };'
);

// handlePriorityChange: add optimistic update
c = c.replace(
  'const handlePriorityChange = (e: ChangeEvent<HTMLSelectElement>) => {\n    updateTaskMut.mutateAsync({ taskId: task.id, data: { priority: e.target.value as any } });\n  };',
  'const handlePriorityChange = (e: ChangeEvent<HTMLSelectElement>) => {\n    const val = e.target.value as any;\n    updateTaskLocal(task.id, { priority: val });\n    updateTaskMut.mutateAsync({ taskId: task.id, data: { priority: val } });\n  };'
);

// handleDateChange: add optimistic update + toast
c = c.replace(
  'const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {\n    updateTaskMut.mutateAsync({ taskId: task.id, data: { dueDate: e.target.value } });\n  };',
  'const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {\n    const val = e.target.value;\n    updateTaskLocal(task.id, { dueDate: val });\n    updateTaskMut.mutateAsync({ taskId: task.id, data: { dueDate: val } }).then(() => {\n      toast("Due date updated", "success");\n    });\n  };'
);

// handleTitleBlur: add optimistic update
c = c.replace(
  'const handleTitleBlur = () => {\n    if (titleEdit.trim() !== "" && titleEdit !== task.title) {\n      updateTaskMut.mutateAsync({ taskId: task.id, data: { title: titleEdit } });\n    } else {\n      setTitleEdit(task.title);\n    }\n  };',
  'const handleTitleBlur = () => {\n    if (titleEdit.trim() !== "" && titleEdit !== task.title) {\n      updateTaskLocal(task.id, { title: titleEdit });\n      updateTaskMut.mutateAsync({ taskId: task.id, data: { title: titleEdit } });\n    } else {\n      setTitleEdit(task.title);\n    }\n  };'
);

// handleDescBlur: add optimistic update
c = c.replace(
  'const handleDescBlur = () => {\n    if (descEdit !== (task.description || "")) {\n      updateTaskMut.mutateAsync({ taskId: task.id, data: { description: descEdit } });\n    }\n  };',
  'const handleDescBlur = () => {\n    if (descEdit !== (task.description || "")) {\n      updateTaskLocal(task.id, { description: descEdit });\n      updateTaskMut.mutateAsync({ taskId: task.id, data: { description: descEdit } });\n    }\n  };'
);

fs.writeFileSync('src/components/drawers/TaskDrawer.tsx', c);
console.log('Done');
