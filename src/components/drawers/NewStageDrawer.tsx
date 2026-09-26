
import { useState } from "react";
import { Drawer } from "../shared/Drawer";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { createProjectStage } from "@/app/actions/project.actions";
import { toast } from "@/lib/store/toast.store";

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export function NewStageDrawer({ open, onClose, projectId }: Props) {
  const { user, firm } = useAuthStore();
  const { projects } = useProjectStore();
  
  const project = projects.find((p) => p.id === projectId);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!firm || !user || !project) return;
    if (!name.trim()) return setError("Name is required");

    setIsSubmitting(true);
    try {
      const newOrder = project.stages.length > 0 
        ? Math.max(...project.stages.map(s => s.order)) + 1 
        : 1;

      const newStage = await createProjectStage({
        projectId,
        name: name.trim(),
        description: description.trim(),
        order: newOrder,
        isClientApprovalRequired: false,
      });
      
      const updatedStages = [...project.stages, {
        id: newStage.id,
        projectId: newStage.projectId,
        name: newStage.name,
        description: newStage.description || "",
        status: newStage.status as any,
        order: newStage.order,
        isClientApprovalRequired: newStage.isClientApprovalRequired,
        clientApprovalStatus: newStage.clientApprovalStatus as any,
        plannedEndDate: newStage.plannedEndDate?.toISOString() || undefined,
        actualEndDate: newStage.actualEndDate?.toISOString() || undefined,
        drawingTypesExpected: [],
        isCustom: newStage.isCustom,
      }];
      
      useProjectStore.getState().updateProject(projectId, { stages: updatedStages });
      
      toast("Milestone added successfully", "success");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add milestone");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="New Milestone" width={400}>
      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
        {error && (
          <div style={{ padding: "10px", background: "var(--color-destructive)", color: "white", borderRadius: "var(--radius-sm)", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>Milestone Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="E.g., Final Handover"
            style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg-input)", color: "var(--color-text-primary)" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>Description (Optional)</label>
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
            {isSubmitting ? "Creating..." : "Add Milestone"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}

