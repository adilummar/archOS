"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useFileStore } from "@/lib/store/file.store";
import { useRequestStore } from "@/lib/store/request.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "@/lib/store/toast.store";
import { FileText, Download, Eye, Plus, FileQuestion, X } from "lucide-react";
import { format, addDays } from "date-fns";

export default function ContractorDrawingsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const { files } = useFileStore();
  const { create } = useRequestStore();
  const { projects } = useProjectStore();
  const { firms, contractors } = useFirmStore();
  const { portalSession } = useAuthStore();

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestDescription, setRequestDescription] = useState("");
  const [requestStageId, setRequestStageId] = useState("");

  const project = projects.find((p) => p.id === projectId);
  const firm = firms.find((f) => f.id === project?.firmId);
  const contractor = contractors.find((c) => c.id === portalSession?.entityId);

  if (!project || !firm || !portalSession || !contractor) return null;

  // Filter files that are explicitly shared with the contractor, or match their trade
  const contractorFiles = files.filter((f) => {
    if (f.projectId !== projectId) return false;
    
    // Explicitly shared via revision
    const latestRev = f.revisions[f.revisions.length - 1];
    if (latestRev?.sharedWithContractorIds.includes(contractor.id)) return true;

    // Matches trade
    if (contractor.trade.toLowerCase() === f.category.toLowerCase()) return true;
    if (contractor.trade.toLowerCase() === "general" && ["architectural", "structural", "document"].includes(f.category)) return true;

    return false;
  });

  const handleDownload = (fileName: string) => {
    toast(`Downloading ${fileName}...`, "info");
  };

  const handleView = (fileName: string) => {
    toast(`Opening ${fileName} in viewer...`, "info");
  };

  const handleRequestFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestDescription.trim()) return;

    create({
      firmId: firm.id,
      projectId: project.id,
      requestedById: portalSession.entityId,
      requesterType: "contractor",
      requesterName: portalSession.entityName,
      description: requestDescription,
      responseDueDate: addDays(new Date(), firm.settings.defaultFileRequestWindowDays).toISOString(),
    });

    toast("Drawing request sent to the architect.", "success");
    setShowRequestForm(false);
    setRequestDescription("");
    setRequestStageId("");
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
            Project Drawings
          </h1>
          <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
            View and download {contractor.trade.toLowerCase()} drawings approved for execution.
          </p>
        </div>
        <button
          onClick={() => setShowRequestForm(true)}
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
          <FileQuestion size={16} /> Request Drawing
        </button>
      </div>

      {/* Request Form Overlay */}
      {showRequestForm && (
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
                Request a Drawing
              </h2>
              <button onClick={() => setShowRequestForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRequestFile} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>
                  What drawing do you need?
                </label>
                <textarea
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  placeholder="e.g. Need the latest HVAC layout for the first floor..."
                  required
                  style={{
                    width: "100%", minHeight: 100, padding: "12px 14px", fontSize: "var(--text-sm)",
                    borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)",
                    background: "var(--color-bg-input)", color: "var(--color-text-primary)", outline: "none", resize: "vertical"
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>
                  Related Stage (Optional)
                </label>
                <select
                  value={requestStageId}
                  onChange={(e) => setRequestStageId(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 14px", fontSize: "var(--text-sm)",
                    borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)",
                    background: "var(--color-bg-input)", color: "var(--color-text-primary)", outline: "none"
                  }}
                >
                  <option value="">-- Select a stage --</option>
                  {project.stages.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
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
                  disabled={!requestDescription.trim()}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "var(--radius-sm)",
                    background: requestDescription.trim() ? "var(--color-accent)" : "var(--color-bg-input)",
                    color: requestDescription.trim() ? "#fff" : "var(--color-text-muted)",
                    border: "none", fontSize: "var(--text-sm)", fontWeight: 500, cursor: requestDescription.trim() ? "pointer" : "not-allowed"
                  }}
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Files List */}
      <div style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden"
      }}>
        {contractorFiles.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--color-text-muted)" }}>
            <FileText size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
            <p style={{ margin: 0, fontSize: "var(--text-base)" }}>No drawings have been shared with you yet.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-canvas)" }}>
                <th style={{ padding: "12px 24px", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>File Name</th>
                <th style={{ padding: "12px 24px", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Category</th>
                <th style={{ padding: "12px 24px", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "12px 24px", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Updated</th>
                <th style={{ padding: "12px 24px", width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {contractorFiles.map(file => (
                <tr key={file.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: "var(--color-bg-input)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
                        <FileText size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)" }}>{file.name}</div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
                          {file.drawingNumber ? `${file.drawingNumber} • ` : ""}Rev {file.currentRevision}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", textTransform: "capitalize" }}>
                    {file.category}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    {file.status === "final" || file.status === "contractor_view" ? (
                      <StatusBadge status="completed" label="For Execution" />
                    ) : (
                      <StatusBadge status="pending" label="For Discussion" />
                    )}
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                    {format(new Date(file.updatedAt), "MMM d, yyyy")}
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "right" }}>
                    {file.status === "final" || file.status === "contractor_view" ? (
                      <button
                        onClick={() => handleDownload(file.name)}
                        title="Download Final File"
                        style={{
                          background: "var(--color-bg-input)", border: "none", color: "var(--color-text-primary)",
                          width: 32, height: 32, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                        }}
                      >
                        <Download size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleView(file.name)}
                        title="View Document"
                        style={{
                          background: "var(--color-bg-input)", border: "none", color: "var(--color-text-primary)",
                          width: 32, height: 32, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                        }}
                      >
                        <Eye size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
