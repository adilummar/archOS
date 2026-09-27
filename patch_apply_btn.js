const fs = require('fs');
let c = fs.readFileSync('src/components/drawers/TaskDrawer.tsx', 'utf8');

// 1. Add pending state after existing state declarations
c = c.replace(
  "const [titleEdit, setTitleEdit] = useState(task?.title || \"\");\r\n  const [descEdit, setDescEdit] = useState(task?.description || \"\");\r\n  const [newSubtask, setNewSubtask] = useState(\"\");\r\n  const [isAddingSubtask, setIsAddingSubtask] = useState(false);",
  "const [titleEdit, setTitleEdit] = useState(task?.title || \"\");\r\n  const [descEdit, setDescEdit] = useState(task?.description || \"\");\r\n  const [newSubtask, setNewSubtask] = useState(\"\");\r\n  const [isAddingSubtask, setIsAddingSubtask] = useState(false);\r\n  const [pendingDate, setPendingDate] = useState<string | null>(null);\r\n  const [pendingPriority, setPendingPriority] = useState<string | null>(null);\r\n  const [isSaving, setIsSaving] = useState(false);\r\n  const hasPendingChanges = pendingDate !== null || pendingPriority !== null || titleEdit !== (task?.title || '') || descEdit !== (task?.description || '');"
);

// 2. Replace handlePriorityChange to just set pending
c = c.replace(
  "const handlePriorityChange = (e: ChangeEvent<HTMLSelectElement>) => {\r\n    const val = e.target.value as any;\r\n    updateTaskLocal(task.id, { priority: val });\r\n    updateTaskMut.mutateAsync({ taskId: task.id, data: { priority: val } });\r\n  };",
  "const handlePriorityChange = (e: ChangeEvent<HTMLSelectElement>) => {\r\n    setPendingPriority(e.target.value);\r\n  };"
);

// 3. Replace handleDateChange to just set pending
c = c.replace(
  "const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {\r\n    const val = e.target.value;\r\n    updateTaskLocal(task.id, { dueDate: val });\r\n    updateTaskMut.mutateAsync({ taskId: task.id, data: { dueDate: val } }).then(() => {\r\n      toast(\"Due date updated\", \"success\");\r\n    });\r\n  };",
  "const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {\r\n    setPendingDate(e.target.value);\r\n  };"
);

// 4. Replace handleTitleBlur to not save immediately (it's covered by Apply)
c = c.replace(
  "const handleTitleBlur = () => {\r\n    if (titleEdit.trim() !== \"\" && titleEdit !== task.title) {\r\n      updateTaskLocal(task.id, { title: titleEdit });\r\n      updateTaskMut.mutateAsync({ taskId: task.id, data: { title: titleEdit } });\r\n    } else {\r\n      setTitleEdit(task.title);\r\n    }\r\n  };",
  "const handleTitleBlur = () => {\r\n    if (titleEdit.trim() === \"\") {\r\n      setTitleEdit(task.title);\r\n    }\r\n  };"
);

// 5. Replace handleDescBlur to not save immediately (covered by Apply)
c = c.replace(
  "const handleDescBlur = () => {\r\n    if (descEdit !== (task.description || \"\")) {\r\n      updateTaskLocal(task.id, { description: descEdit });\r\n      updateTaskMut.mutateAsync({ taskId: task.id, data: { description: descEdit } });\r\n    }\r\n  };",
  "const handleDescBlur = () => {\r\n    // description saved via Apply button\r\n  };"
);

// 6. Add handleApply function before handleAddSubtask
c = c.replace(
  "  const handleAddSubtask = () => {",
  `  const handleApply = async () => {
    const patch: Record<string, any> = {};
    if (titleEdit.trim() !== "" && titleEdit !== task.title) patch.title = titleEdit;
    if (descEdit !== (task.description || "")) patch.description = descEdit;
    if (pendingDate !== null) patch.dueDate = pendingDate;
    if (pendingPriority !== null) patch.priority = pendingPriority;
    if (Object.keys(patch).length === 0) return;
    setIsSaving(true);
    try {
      updateTaskLocal(task.id, patch as any);
      await updateTaskMut.mutateAsync({ taskId: task.id, data: patch });
      setPendingDate(null);
      setPendingPriority(null);
      toast("Changes saved", "success");
    } catch {
      toast("Failed to save changes", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubtask = () => {`
);

// 7. Update date input to show pendingDate if set
c = c.replace(
  "value={task.dueDate ? task.dueDate.split('T')[0] : ''}",
  "value={pendingDate !== null ? pendingDate : (task.dueDate ? task.dueDate.split('T')[0] : '')}"
);

// 8. Update priority select to show pendingPriority if set
c = c.replace(
  "value={task.priority}\r\n                onChange={handlePriorityChange}",
  "value={pendingPriority !== null ? pendingPriority : task.priority}\r\n                onChange={handlePriorityChange}"
);

// 9. Add Apply button after the due date + priority row (after the closing </div> of that flex row at line ~460)
c = c.replace(
  "        <div style={{ borderTop: \"1px solid var(--color-border)\" }} />\r\n\r\n        {/* Description */}",
  `        {/* Apply Changes Button */}
        {!readonly && hasPendingChanges && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleApply}
              disabled={isSaving}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                background: "var(--color-accent)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-sm)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: isSaving ? "not-allowed" : "pointer",
                opacity: isSaving ? 0.7 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {isSaving ? "Saving..." : "Apply Changes"}
            </button>
          </div>
        )}

        <div style={{ borderTop: "1px solid var(--color-border)" }} />\r\n\r\n        {/* Description */}`
);

fs.writeFileSync('src/components/drawers/TaskDrawer.tsx', c);
console.log('Done - replacements made:');
console.log('pendingDate:', c.includes('pendingDate'));
console.log('handleApply:', c.includes('handleApply'));
console.log('Apply Changes button:', c.includes('Apply Changes'));
