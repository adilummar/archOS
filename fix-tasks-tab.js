const fs = require('fs');

const file = 'src/components/project/TasksTab.tsx';
let content = fs.readFileSync(file, 'utf-8');

if (!content.includes('import { useTasks, useUpdateTask }')) {
    content = content.replace('import { useTaskStore } from "../../lib/store/task.store";', 'import { useTaskStore } from "../../lib/store/task.store";\nimport { useTasks, useUpdateTask } from "@/hooks/useTasks";');
}

content = content.replace(/const \{ tasks, setTaskStatus \} = useTaskStore\(\);/, 'const { data: tasks = [] } = useTasks(project.firmId);\n  const updateTaskMut = useUpdateTask(project.firmId, user?.id || "");');

// Replace setTaskStatus
content = content.replace(/setTaskStatus\(sourceTask.id, targetColumnId as any\);/g, 'updateTaskMut.mutateAsync({ taskId: sourceTask.id, data: { status: targetColumnId } });');
content = content.replace(/setTaskStatus\(sourceTask.id, overTask.status\);/g, 'updateTaskMut.mutateAsync({ taskId: sourceTask.id, data: { status: overTask.status } });');

fs.writeFileSync(file, content);
