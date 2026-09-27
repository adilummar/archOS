const fs = require('fs');
const filePath = 'src/app/actions/task.actions.ts';
let content = fs.readFileSync(filePath, 'utf8');

const newFuncs = `
export async function assignActiveTask(taskId: string, dueDate: Date, assigneeId?: string) {
  const ctx = await getCtx();
  const result = await Service.assignActiveTask(ctx, taskId, dueDate, assigneeId);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return result;
}

export async function submitTaskForReview(taskId: string) {
  const ctx = await getCtx();
  const result = await Service.submitTaskForReview(ctx, taskId);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return result;
}

export async function requestTaskRevisionSequence(taskId: string, remark: string, newDueDate: Date) {
  const ctx = await getCtx();
  const result = await Service.requestTaskRevisionSequence(ctx, taskId, remark, newDueDate);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return result;
}

export async function approveTaskSequence(taskId: string) {
  const ctx = await getCtx();
  const result = await Service.approveTaskSequence(ctx, taskId);
  revalidatePath("/[firmSlug]/projects/[projectId]", "page");
  revalidatePath("/[firmSlug]/tasks", "page");
  return result;
}
`;

fs.writeFileSync(filePath, content + newFuncs, 'utf8');
console.log("Appended workflow actions to task.actions.ts");
