import re

with open("src/components/drawers/TaskDrawer.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Import TaskActions
if "import * as TaskActions" not in content:
    content = content.replace(
        'import { toast } from "../../lib/store/toast.store";',
        'import { toast } from "../../lib/store/toast.store";\nimport * as TaskActions from "@/app/actions/task.actions";'
    )

# 2. Make Status Read-Only (replace the <select>)
select_regex = r"<select\s+value=\{task\.status\}[\s\S]*?</select>"
replacement_status = """<div style={{ padding: "6px 12px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
            <StatusBadge status={task.status} size="sm" />
          </div>"""
content = re.sub(select_regex, replacement_status, content)


# 3. Add Workflow Handlers
handlers = """
  const handleAssignActiveTask = async () => {
    if (!pendingDate) {
      toast("Due date is required to assign.", "error");
      return;
    }
    const finalAssigneeId = task.assigneeId || undefined;
    setIsSaving(true);
    try {
      await TaskActions.assignActiveTask(task.id, new Date(pendingDate), finalAssigneeId);
      toast("Task assigned successfully", "success");
      setPendingDate(null);
      // Wait for revalidation
      onClose();
    } catch (err: any) {
      toast(err.message || "Failed to assign task", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartWork = async () => {
    setIsSaving(true);
    try {
      await updateTaskMut.mutateAsync({ taskId: task.id, data: { status: "in_progress" } });
      toast("Task started", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGiveForReview = async () => {
    setIsSaving(true);
    try {
      await TaskActions.submitTaskForReview(task.id);
      toast("Task submitted for review", "success");
      onClose();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    setIsSaving(true);
    try {
      await TaskActions.approveTaskSequence(task.id);
      toast("Task approved and completed", "success");
      onClose();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestRevision = async () => {
    const remark = prompt("Enter revision remark:");
    if (!remark) return;
    const dateStr = prompt("Enter new due date (YYYY-MM-DD):", pendingDate || "");
    if (!dateStr) return;
    setIsSaving(true);
    try {
      await TaskActions.requestTaskRevisionSequence(task.id, remark, new Date(dateStr));
      toast("Revision requested", "success");
      onClose();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApply = async () => {
"""
content = content.replace("  const handleApply = async () => {", handlers)


# 4. Add Workflow Buttons to the bottom
buttons_regex = r"\{/\* Apply Changes Button \*/\}[\s\S]*?\{/\* Tabs \*/\}"
new_buttons = """{/* Workflow Buttons */}
        {!readonly && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8, paddingBottom: 16, borderBottom: "1px solid var(--color-border)" }}>
            
            {hasPendingChanges && task.status !== "active" && (
               <button
                 onClick={handleApply}
                 disabled={isSaving}
                 style={{ padding: "8px 18px", background: "var(--color-bg-canvas)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", cursor: isSaving ? "not-allowed" : "pointer" }}
               >
                 {isSaving ? "Saving..." : "Save Details"}
               </button>
            )}

            {task.status === "active" && isAdminOrLead && (
              <button
                onClick={handleAssignActiveTask}
                disabled={isSaving}
                style={{ padding: "8px 18px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer" }}
              >
                {isSaving ? "Assigning..." : "Assign Task"}
              </button>
            )}

            {task.status === "assigned" && isAssignee && (
              <button
                onClick={handleStartWork}
                disabled={isSaving}
                style={{ padding: "8px 18px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer" }}
              >
                {isSaving ? "Starting..." : "Start Work"}
              </button>
            )}

            {(task.status === "in_progress" || task.status === "revision_requested") && isAssignee && (
              <button
                onClick={handleGiveForReview}
                disabled={isSaving}
                style={{ padding: "8px 18px", background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer" }}
              >
                {isSaving ? "Submitting..." : "Give for Review"}
              </button>
            )}

            {task.status === "submitted_for_review" && isAdminOrLead && (
              <>
                <button
                  onClick={handleRequestRevision}
                  disabled={isSaving}
                  style={{ padding: "8px 18px", background: "var(--color-destructive)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer" }}
                >
                  Request Revision
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isSaving}
                  style={{ padding: "8px 18px", background: "var(--color-success)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer" }}
                >
                  {isSaving ? "Approving..." : "Approve"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Tabs */}"""
content = re.sub(buttons_regex, new_buttons, content)

with open("src/components/drawers/TaskDrawer.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Patched TaskDrawer.tsx")
