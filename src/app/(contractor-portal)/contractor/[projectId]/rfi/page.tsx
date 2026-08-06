"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useRfiStore } from "@/lib/store/rfi.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "@/lib/store/toast.store";
import { MessageCircleQuestion, Plus, X, Search } from "lucide-react";
import { format } from "date-fns";

export default function ContractorRFIsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const { rfis, create } = useRfiStore();
  const { projects } = useProjectStore();
  const { portalSession } = useAuthStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const project = projects.find((p) => p.id === projectId);

  if (!project || !portalSession) return null;

  // Filter RFIs raised by this contractor on this project
  const contractorRfis = rfis
    .filter((rfi) => rfi.projectId === projectId && rfi.raisedById === portalSession.entityId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleCreateRfi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    create({
      firmId: project.firmId,
      projectId: project.id,
      title: newTitle,
      description: newDescription,
      raisedById: portalSession.entityId,
      raiserType: "contractor",
      raiserName: portalSession.entityName,
      priority: "medium", // Default priority for contractor-raised
    });

    toast("RFI submitted successfully.", "success");
    setShowCreateForm(false);
    setNewTitle("");
    setNewDescription("");
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
            Requests for Information (RFI)
          </h1>
          <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
            Ask questions, request clarifications, or report discrepancies to the architect.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: "10px 16px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-accent)",
            color: "#fff",
            border: "none",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Plus size={16} /> Raise New RFI
        </button>
      </div>

      {/* Create Form Overlay */}
      {showCreateForm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24
        }}>
          <div style={{
            background: "var(--color-bg-card)",
            borderRadius: "var(--radius-lg)",
            padding: 32,
            width: "100%", maxWidth: 600,
            boxShadow: "var(--shadow-modal)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                Raise a new RFI
              </h2>
              <button onClick={() => setShowCreateForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateRfi} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Discrepancy in HVAC ducting on First Floor"
                  required
                  style={{
                    width: "100%", padding: "12px 14px", fontSize: "var(--text-base)",
                    borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)",
                    background: "var(--color-bg-input)", color: "var(--color-text-primary)", outline: "none"
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>
                  Detailed Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the issue, question, or clarification needed..."
                  required
                  style={{
                    width: "100%", minHeight: 120, padding: "12px 14px", fontSize: "var(--text-sm)",
                    borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)",
                    background: "var(--color-bg-input)", color: "var(--color-text-primary)", outline: "none", resize: "vertical"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{
                    flex: 1, padding: "12px", borderRadius: "var(--radius-sm)",
                    background: "transparent", color: "var(--color-text-primary)",
                    border: "1px solid var(--color-border)", fontSize: "var(--text-sm)", fontWeight: 500, cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || !newDescription.trim()}
                  style={{
                    flex: 1, padding: "12px", borderRadius: "var(--radius-sm)",
                    background: (newTitle.trim() && newDescription.trim()) ? "var(--color-accent)" : "var(--color-bg-input)",
                    color: (newTitle.trim() && newDescription.trim()) ? "#fff" : "var(--color-text-muted)",
                    border: "none", fontSize: "var(--text-sm)", fontWeight: 500, cursor: (newTitle.trim() && newDescription.trim()) ? "pointer" : "not-allowed"
                  }}
                >
                  Submit RFI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RFI List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {contractorRfis.length === 0 ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--color-text-muted)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
            <MessageCircleQuestion size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
            <p style={{ margin: 0, fontSize: "var(--text-base)" }}>You haven't raised any RFIs yet.</p>
          </div>
        ) : (
          contractorRfis.map((rfi) => (
            <div key={rfi.id} style={{
              background: "var(--color-bg-card)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)", overflow: "hidden", display: "flex", flexDirection: "column"
            }}>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", background: "var(--color-bg-canvas)", padding: "4px 8px", borderRadius: 4 }}>
                        {rfi.rfiNumber}
                      </span>
                      <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {rfi.title}
                      </h3>
                    </div>
                    <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                      {rfi.description}
                    </p>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 12 }}>
                      Submitted on {format(new Date(rfi.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {rfi.priority !== 'medium' && (
                      <StatusBadge status={rfi.priority} />
                    )}
                    <StatusBadge status={rfi.status} />
                  </div>
                </div>
              </div>
              
              {rfi.status === 'responded' || rfi.status === 'closed' ? (
                <div style={{ background: "var(--color-bg-canvas)", borderTop: "1px solid var(--color-border)", borderLeft: "4px solid var(--color-success)", padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--color-success)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                      <MessageCircleQuestion size={12} />
                    </div>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      Architect's Response
                    </span>
                    {rfi.respondedAt && (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginLeft: "auto" }}>
                        {format(new Date(rfi.respondedAt), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-primary)", lineHeight: 1.5, paddingLeft: 32 }}>
                    {rfi.responseText}
                  </p>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
