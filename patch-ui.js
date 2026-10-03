const fs = require('fs');

function patchTaskDrawer() {
  const file = 'src/components/drawers/TaskDrawer.tsx';
  let content = fs.readFileSync(file, 'utf-8');

  const oldAssign = `  const handleAssignActiveTask = async () => {
    if (!pendingDate) {
      toast("Due date is required to assign.", "error");
      return;
    }
    const finalAssigneeId = pendingAssigneeId || task.assigneeId || undefined;
    if (teamMembers.length > 1 && !finalAssigneeId) {
      toast("Please select an assignee.", "error");
      return;
    }
    setIsSaving(true);
    try {
      await TaskActions.assignActiveTask(task.id, new Date(pendingDate), finalAssigneeId);`;

  const newAssign = `  const handleAssignActiveTask = async () => {
    const finalAssigneeId = pendingAssigneeId || task.assigneeId || undefined;
    if (teamMembers.length > 1 && !finalAssigneeId) {
      toast("Please select an assignee.", "error");
      return;
    }
    setIsSaving(true);
    try {
      const parsedDate = pendingDate ? new Date(pendingDate) : null;
      await TaskActions.assignActiveTask(task.id, parsedDate, finalAssigneeId);`;

  content = content.replace(oldAssign, newAssign);
  fs.writeFileSync(file, content);
  console.log('Patched TaskDrawer.tsx');
}

function patchTaskActions() {
  const file = 'src/app/actions/task.actions.ts';
  let content = fs.readFileSync(file, 'utf-8');

  const oldSig = `export async function assignActiveTask(taskId: string, dueDate: Date, assigneeId?: string) {`;
  const newSig = `export async function assignActiveTask(taskId: string, dueDate?: Date | null, assigneeId?: string) {`;
  
  content = content.replace(oldSig, newSig);
  fs.writeFileSync(file, content);
  console.log('Patched task.actions.ts');
}

patchTaskDrawer();
patchTaskActions();
