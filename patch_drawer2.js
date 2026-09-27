const fs = require('fs');
let c = fs.readFileSync('src/components/drawers/TaskDrawer.tsx', 'utf8');

// Fix handleStatusChange
c = c.replace(
  "handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {\r\n    const val = e.target.value as any;\r\n    updateTaskMut.mutateAsync({ taskId: task.id, data: { status: val } });\r\n    toast(\"Status updated\", \"success\");\r\n  };",
  "handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {\r\n    const val = e.target.value as any;\r\n    updateTaskLocal(task.id, { status: val });\r\n    updateTaskMut.mutateAsync({ taskId: task.id, data: { status: val } });\r\n    toast(\"Status updated\", \"success\");\r\n  };"
);

// Fix handlePriorityChange
c = c.replace(
  "const handlePriorityChange = (e: ChangeEvent<HTMLSelectElement>) => {\r\n    updateTaskMut.mutateAsync({ taskId: task.id, data: { priority: e.target.value as any } });\r\n  };",
  "const handlePriorityChange = (e: ChangeEvent<HTMLSelectElement>) => {\r\n    const val = e.target.value as any;\r\n    updateTaskLocal(task.id, { priority: val });\r\n    updateTaskMut.mutateAsync({ taskId: task.id, data: { priority: val } });\r\n  };"
);

// Fix handleDateChange
c = c.replace(
  "const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {\r\n    updateTaskMut.mutateAsync({ taskId: task.id, data: { dueDate: e.target.value } });\r\n  };",
  "const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {\r\n    const val = e.target.value;\r\n    updateTaskLocal(task.id, { dueDate: val });\r\n    updateTaskMut.mutateAsync({ taskId: task.id, data: { dueDate: val } }).then(() => {\r\n      toast(\"Due date updated\", \"success\");\r\n    });\r\n  };"
);

// Fix handleTitleBlur
c = c.replace(
  "const handleTitleBlur = () => {\r\n    if (titleEdit.trim() !== \"\" && titleEdit !== task.title) {\r\n      updateTaskMut.mutateAsync({ taskId: task.id, data: { title: titleEdit } });\r\n    } else {\r\n      setTitleEdit(task.title);\r\n    }\r\n  };",
  "const handleTitleBlur = () => {\r\n    if (titleEdit.trim() !== \"\" && titleEdit !== task.title) {\r\n      updateTaskLocal(task.id, { title: titleEdit });\r\n      updateTaskMut.mutateAsync({ taskId: task.id, data: { title: titleEdit } });\r\n    } else {\r\n      setTitleEdit(task.title);\r\n    }\r\n  };"
);

// Fix handleDescBlur
c = c.replace(
  "const handleDescBlur = () => {\r\n    if (descEdit !== (task.description || \"\")) {\r\n      updateTaskMut.mutateAsync({ taskId: task.id, data: { description: descEdit } });\r\n    }\r\n  };",
  "const handleDescBlur = () => {\r\n    if (descEdit !== (task.description || \"\")) {\r\n      updateTaskLocal(task.id, { description: descEdit });\r\n      updateTaskMut.mutateAsync({ taskId: task.id, data: { description: descEdit } });\r\n    }\r\n  };"
);

fs.writeFileSync('src/components/drawers/TaskDrawer.tsx', c);
console.log('Done');
