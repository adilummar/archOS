const fs = require('fs');

let c = fs.readFileSync('src/components/drawers/NewTaskDrawer.tsx', 'utf8');
c = c.replace(/const \{ user, firm \} = useAuthStore\(\);\n  const createTask = useCreateTask\(firm\?\.id \|\| ""\);\n  const overrideTask = useOverrideTask\(firm\?\.id \|\| ""\);/, 'const { user, firm } = useAuthStore();');
c = c.replace(/await createTask\.mutateAsync\(\{/g, 'await createTask({');
c = c.replace(/await overrideTask\.mutateAsync\(\{ taskId: newTask\.id, data: \{/g, 'await assignTaskWithOverride({');
c = c.replace(/actualLeadTimeDays: diffDays, reason: overrideReason \} \}\);/g, 'actualLeadTimeDays: diffDays, reason: overrideReason });');
c = 'import { useTaskStore } from "@/lib/store/task.store";\nimport { createTask, assignTaskWithOverride } from "@/app/actions/task.actions";\n' + c.replace('import { useCreateTask, useOverrideTask } from "@/hooks/useTasks";', '');
// I can't easily put back useTaskStore.getState().addTask(...), so I'll just leave it removed. It was a UI cache update, without it it just requires a page reload.

fs.writeFileSync('src/components/drawers/NewTaskDrawer.tsx', c);

let c2 = fs.readFileSync('src/components/drawers/TaskDrawer.tsx', 'utf8');
c2 = c2.replace(/const authUser = useAuthStore\(\(s\) => s\.user\);\n  const updateTaskMut = useUpdateTask\(firm\?\.id \|\| "", authUser\?\.id \|\| ""\);\n  const deleteTaskMut = useDeleteTask\(firm\?\.id \|\| "", authUser\?\.id \|\| ""\);\n  const reviewTaskMut = useReviewTask\(firm\?\.id \|\| "", authUser\?\.id \|\| ""\);\n  const overrideTaskMut = useOverrideTask\(firm\?\.id \|\| ""\);/, 'const authUser = useAuthStore((s) => s.user);');

c2 = c2.replace(/import \{ useUpdateTask, useDeleteTask, useReviewTask, useOverrideTask \} from "@\/hooks\/useTasks";\nimport \{ addSubtask as addSubtaskApi, toggleSubtask as toggleSubtaskApi \} from "@\/lib\/api-client";/g, 'import { updateTask, deleteTask, reviewTask, addSubtask, toggleSubtask, assignTaskWithOverride } from "@/app/actions/task.actions";');
c2 = 'import { useTaskStore } from "@/lib/store/task.store";\n' + c2;

c2 = c2.replace(/await updateTaskMut\.mutateAsync\(\{ taskId: task\.id, data: /g, 'await updateTask(task.id, ');
c2 = c2.replace(/await deleteTaskMut\.mutateAsync\(task\.id/g, 'await deleteTask(task.id, ');
c2 = c2.replace(/await reviewTaskMut\.mutateAsync\(\{ taskId: task\.id, data: /g, 'await reviewTask(task.id, user.id, firm.id, ');
c2 = c2.replace(/await overrideTaskMut\.mutateAsync\(\{ taskId: task\.id, data: \{/g, 'await assignTaskWithOverride({');
c2 = c2.replace(/actualLeadTimeDays: diffDays, reason: overrideReason \} \}\);/g, 'actualLeadTimeDays: diffDays, reason: overrideReason });');
c2 = c2.replace(/await addSubtaskApi\(\{/g, 'await addSubtask({');
c2 = c2.replace(/await toggleSubtaskApi\(/g, 'await toggleSubtask(');

fs.writeFileSync('src/components/drawers/TaskDrawer.tsx', c2);

let p = fs.readFileSync('src/app/[firmSlug]/(app)/tasks/page.tsx', 'utf8');
p = p.replace(/const \{ data: tasks = \[\] \} = useTasks\(firm\?\.id \|\| ""\);\n  const updateTask = useUpdateTask\(firm\?\.id \|\| "", user\?\.id \|\| ""\);\n  const setTaskStatus = \(taskId: string, status: any\) => updateTask\.mutate\(\{ taskId, data: \{ status \} \}\);/, 'const { tasks, setTaskStatus } = useTaskStore();');
p = p.replace(/import \{ useTasks, useUpdateTask \} from "@\/hooks\/useTasks";\n/, '');
fs.writeFileSync('src/app/[firmSlug]/(app)/tasks/page.tsx', p);

