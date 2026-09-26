import { useCreateTask, useOverrideTask } from "@/hooks/useTasks";

import { useState } from "react";
import { Drawer } from "../shared/Drawer";
import { useFirmStore } from "@/lib/store/firm.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";


import { toast } from "@/lib/store/toast.store";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onClose: () => void;
  projectId?: string;
}

export function NewTaskDrawer({ open, onClose, projectId }: Props) {
  const { user, firm } = useAuthStore();
  const createTaskMut = useCreateTask(firm?.id || "");
  const overrideTaskMut = useOverrideTask(firm?.id || "");
  const { users } = useFirmStore();
  const { projects } = useProjectStore();
  
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || "");
  const project = projects.find((p) => p.id === selectedProjectId);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stageId, setStageId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overrideModal, setOverrideModal] = useState<{ open: boolean } | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  // Set default stage and assignee when opened
  if (open && !stageId && project?.stages.length) {
    setStageId(project.currentStageId || project.stages[0].id);
  }
  if (open && !assigneeId && user) {
    setAssigneeId(user.id);
  }

  const handleSubmit = async () => {
    if (!firm || !user) return;
    if (!selectedProjectId) return setError("Project is required");
    if (!title.trim()) return setError("Title is required");
    if (!stageId) return setError("Stage is required");
    if (!assigneeId) return setError("Assignee is required");

    if (dueDate && firm!.minimumTaskLeadTimeDays > 0) {
      const due = new Date(dueDate);
      const today = new Date();
      today.setHours(0,0,0,0); due.setHours(0,0,0,0);
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < firm!.minimumTaskLeadTimeDays) {
        setOverrideModal({ open: true });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const newTask = await createTaskMut.mutateAsync({
        firmId: firm!.id,
        projectId: selectedProjectId,
        stageId,
        title: title.trim(),
        description: description.trim(),
        assigneeId,
        assignerId: user!.id,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      
      
      
      toast("Task created successfully", "success");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStaff = users.filter((u) => u.firmId === firm?.id && u.status === "active");

  return (
    <Drawer open={open} onClose={onClose} title="New Task" width={400}>
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
        {error && (
          <div style={{ padding: "10px", background: "var(--color-destructive)", color: "white", borderRadius: "var(--radius-sm)", fontSize: "13px" }}>
            {error}
          </div>
        )}

        {!projectId && (
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>Project</label>
            <select 
              value={selectedProjectId} 
              onChange={(e) => { setSelectedProjectId(e.target.value); setStageId(""); }}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)" }}
            >
              <option value="" disabled>Select a project</option>
              {projects.filter(p => p.firmId === firm?.id).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>Title</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="E.g., Review floor plans"
            style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>Stage</label>
          <select 
            value={stageId} 
            onChange={(e) => setStageId(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)" }}
          >
            {project?.stages.map((stage) => (
              <option key={stage.id} value={stage.id}>{stage.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>Assignee</label>
          <select 
            value={assigneeId} 
            onChange={(e) => setAssigneeId(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)" }}
          >
            {activeStaff.map((staff) => (
              <option key={staff.id} value={staff.id}>{staff.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>Priority</label>
          <select 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)" }}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>Due Date</label>
          <input 
            type="date" 
            value={dueDate} 
            onChange={(e) => setDueDate(e.target.value)} 
            style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>Description</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            rows={3}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)", resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} style={{ padding: "8px 16px", background: "var(--color-accent)", border: "none", color: "white", borderRadius: "var(--radius-sm)", cursor: "pointer", opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>
      {overrideModal?.open && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--color-bg-card)", padding: 24, borderRadius: 8, width: 300, border: "1px solid var(--color-border)" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "var(--color-text-primary)" }}>Late Assignment Override</h3>
            <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "var(--color-text-muted)" }}>This assignment violates the minimum lead time of {firm?.minimumTaskLeadTimeDays} days. Please provide a reason to override.</p>
            <textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Reason for late assignment..." style={{ width: "100%", minHeight: 80, padding: 8, borderRadius: 4, border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)", marginBottom: 16 }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setOverrideModal(null)} style={{ padding: "6px 12px", borderRadius: 4, border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text-secondary)", cursor: "pointer" }}>Cancel</button>
              <button onClick={async () => {
                if (!overrideReason.trim()) return setError("Reason is required");
                setIsSubmitting(true);
                setOverrideModal(null);
                try {
                  const newTask = await createTaskMut.mutateAsync({
                    firmId: firm!.id,
                    projectId: selectedProjectId,
                    stageId,
                    title: title.trim(),
                    description: description.trim(),
                    assigneeId,
                    assignerId: user!.id,
                    priority,
                    dueDate: dueDate ? new Date(dueDate) : undefined,
                  });
                  const due = new Date(dueDate);
                  const today = new Date();
                  today.setHours(0,0,0,0); due.setHours(0,0,0,0);
                  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  await overrideTaskMut.mutateAsync({ taskId: newTask.id, data: {
                    firmId: firm!.id,
                    taskId: newTask.id,
                    assigneeId: assigneeId,
                    requestedDueDate: due,
                    requiredLeadTimeDays: firm!.minimumTaskLeadTimeDays,
                    actualLeadTimeDays: diffDays, reason: overrideReason } });
                  
                  toast("Task created with override", "success");
                  onClose();
                } catch (e: any) {
                  setError(e.message);
                  setIsSubmitting(false);
                }
              }} style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "var(--color-destructive)", color: "white", cursor: "pointer" }}>Override</button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}









