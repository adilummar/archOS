"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { usePunchlistStore } from "@/lib/store/punchlist.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "@/lib/store/toast.store";
import { CheckCircle2, ClipboardList, MapPin, X } from "lucide-react";
import { format } from "date-fns";

export default function ContractorPunchListPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const { items, resolveByContractor } = usePunchlistStore();
  const { projects } = useProjectStore();
  const { portalSession } = useAuthStore();

  const [resolvingItemId, setResolvingItemId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  const project = projects.find((p) => p.id === projectId);

  if (!project || !portalSession) return null;

  // Filter punch list items assigned to this contractor
  const contractorItems = items
    .filter((item) => item.projectId === projectId && item.assignedContractorId === portalSession.entityId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingItemId) return;
    if (!resolutionNote.trim()) {
      toast("Please add a note about how this was resolved.", "error");
      return;
    }

    resolveByContractor(resolvingItemId, resolutionNote);
    toast("Item marked as resolved. Pending architect confirmation.", "success");
    setResolvingItemId(null);
    setResolutionNote("");
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
          Punch List
        </h1>
        <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
          Defects and snagging items assigned to you for resolution.
        </p>
      </div>

      {/* Resolve Modal Overlay */}
      {resolvingItemId && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24
        }}>
          <div style={{
            background: "var(--color-bg-card)",
            borderRadius: "var(--radius-lg)",
            padding: 32,
            width: "100%", maxWidth: 500,
            boxShadow: "var(--shadow-modal)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                Mark as Resolved
              </h2>
              <button onClick={() => { setResolvingItemId(null); setResolutionNote(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleResolve} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>
                  Resolution Note <span style={{ color: "var(--color-destructive)" }}>*</span>
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Describe what was done to fix the issue..."
                  required
                  style={{
                    width: "100%", minHeight: 100, padding: "12px 14px", fontSize: "var(--text-sm)",
                    borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)",
                    background: "var(--color-bg-input)", color: "var(--color-text-primary)", outline: "none", resize: "vertical"
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => { setResolvingItemId(null); setResolutionNote(""); }}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "var(--radius-sm)",
                    background: "transparent", color: "var(--color-text-primary)",
                    border: "1px solid var(--color-border)", fontSize: "var(--text-sm)", fontWeight: 500, cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!resolutionNote.trim()}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "var(--radius-sm)",
                    background: resolutionNote.trim() ? "var(--color-success)" : "var(--color-bg-input)",
                    color: resolutionNote.trim() ? "#fff" : "var(--color-text-muted)",
                    border: "none", fontSize: "var(--text-sm)", fontWeight: 500, cursor: resolutionNote.trim() ? "pointer" : "not-allowed"
                  }}
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {contractorItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--color-text-muted)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
            <ClipboardList size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
            <p style={{ margin: 0, fontSize: "var(--text-base)" }}>No punch list items assigned to you.</p>
          </div>
        ) : (
          contractorItems.map((item) => (
            <div key={item.id} style={{
              background: "var(--color-bg-card)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)", overflow: "hidden"
            }}>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", background: "var(--color-bg-canvas)", padding: "4px 8px", borderRadius: 4 }}>
                        {item.itemNumber}
                      </span>
                      <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {item.description}
                      </h3>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        <MapPin size={14} />
                        {item.location}
                      </div>
                      {item.dueDate && (
                        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          Due: {format(new Date(item.dueDate), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
                    <StatusBadge status={item.status} />
                    {item.status === "open" && (
                      <button
                        onClick={() => setResolvingItemId(item.id)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--color-bg-canvas)",
                          color: "var(--color-text-primary)",
                          border: "1px solid var(--color-border)",
                          fontSize: "var(--text-sm)",
                          fontWeight: 500,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <CheckCircle2 size={16} /> Resolve Issue
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {item.status !== "open" && item.contractorNote && (
                <div style={{ background: "var(--color-bg-canvas)", borderTop: "1px solid var(--color-border)", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    Resolution Details
                  </div>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                    {item.contractorNote}
                  </p>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    Resolved on {item.contractorResolvedAt ? format(new Date(item.contractorResolvedAt), "MMM d, yyyy") : ""}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
