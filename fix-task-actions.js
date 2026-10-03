const fs = require('fs');

const file = 'src/components/drawers/TaskDrawer.tsx';
let content = fs.readFileSync(file, 'utf-8');

if (!content.includes('import { useAssignTaskSequence')) {
  content = content.replace('import { useTasks, useUpdateTask, useDeleteTask', 'import { useTasks, useUpdateTask, useDeleteTask, useAssignTaskSequence, useSubmitTaskForReviewSequence, useApproveTaskSequence, useRequestTaskRevisionSequence, useStartTaskSequence');
}

// Instantiate hooks
if (!content.includes('const assignTaskMut =')) {
  content = content.replace('const authUser = useAuthStore((s) => s.user);\n    const firmId = authUser?.firmId || "";', 'const authUser = useAuthStore((s) => s.user);\n    const firmId = authUser?.firmId || "";\n    const assignTaskMut = useAssignTaskSequence(firmId);\n    const startTaskMut = useStartTaskSequence(firmId);\n    const submitReviewMut = useSubmitTaskForReviewSequence(firmId);\n    const approveTaskMut = useApproveTaskSequence(firmId);\n    const requestRevisionMut = useRequestTaskRevisionSequence(firmId);');
}

// Replace Server Actions
content = content.replace(/await TaskActions\.assignActiveTask\(task\.id, parsedDate, finalAssigneeId\);/g, 'await assignTaskMut.mutateAsync({ taskId: task.id, dueDate: parsedDate ? parsedDate.toISOString() : null, assigneeId: finalAssigneeId });');

content = content.replace(/await TaskActions\.submitTaskForReview\(task\.id\);/g, 'await submitReviewMut.mutateAsync({ taskId: task.id });');

content = content.replace(/await TaskActions\.approveTaskSequence\(task\.id\);/g, 'await approveTaskMut.mutateAsync({ taskId: task.id });');

content = content.replace(/await TaskActions\.requestTaskRevisionSequence\(task\.id, remark, new Date\(dateStr\)\);/g, 'await requestRevisionMut.mutateAsync({ taskId: task.id, remark, newDueDate: new Date(dateStr).toISOString() });');

content = content.replace(/await TaskActions\.requestTaskRevisionSequence\(task\.id, "Revision required", new Date\(\)\);/g, 'await requestRevisionMut.mutateAsync({ taskId: task.id, remark: "Revision required", newDueDate: new Date().toISOString() });');

content = content.replace(/const updated = await TaskActions\.startTask\(task\.id\);/g, 'await startTaskMut.mutateAsync({ taskId: task.id });');

fs.writeFileSync(file, content);
