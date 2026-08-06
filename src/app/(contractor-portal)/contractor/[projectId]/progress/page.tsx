"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useSitereportStore } from "@/lib/store/sitereport.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { toast } from "@/lib/store/toast.store";
import { Plus, X, Calendar, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";
import { nowIso } from "@/lib/store/uid";

export default function ContractorProgressPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const { reports, add } = useSitereportStore();
  const { projects } = useProjectStore();
  const { portalSession } = useAuthStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [workCompleted, setWorkCompleted] = useState("");
  const [mistakesOrIssues, setMistakesOrIssues] = useState("");
  const [materialsReceived, setMaterialsReceived] = useState("");
  const [workersPresent, setWorkersPresent] = useState<number | "">("");

  const project = projects.find((p) => p.id === projectId);

  if (!project || !portalSession) return null;

  // Filter reports by this contractor on this project
  const contractorReports = reports
    .filter((r) => r.projectId === projectId && r.reportedById === portalSession.entityId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workCompleted.trim()) return;

    add({
      firmId: project.firmId,
      projectId: project.id,
      reportedById: portalSession.entityId,
      date: new Date(date).toISOString(), // Ensure proper format
      workCompleted,
      mistakesOrIssues,
      materialsReceived,
      workersPresent: workersPresent ? Number(workersPresent) : undefined,
    });

    toast("Progress report submitted successfully.", "success");
    setShowCreateForm(false);
    
    // Reset
    setDate(new Date().toISOString().split("T")[0]);
    setWorkCompleted("");
    setMistakesOrIssues("");
    setMaterialsReceived("");
    setWorkersPresent("");
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
            Progress Updates
          </h1>
          <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
            Submit daily or weekly site reports to the architect.
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
          <Plus size={16} /> New Report
        </button>
      </div>

      {/* Create Form Overlay */}
      {showCreateForm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          overflowY: "auto"
        }}>
          <div style={{
            background: "var(--color-bg-card)",
            borderRadius: "var(--radius-lg)",
            padding: 32,
            width: "100%", maxWidth: 600,
            boxShadow: "var(--shadow-modal)",
            marginTop: "auto",
            marginBottom: "auto"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                Submit Progress Report
              </h2>
              <button onClick={() => setShowCreateForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>
                    Report Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={{
                      width: "100%", padding: "10px 14px", fontSize: "var(--text-base)",
                      borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)",
                      background: "var(--color-bg-input)", color: "var(--color-text-primary)", outline: "none"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>
                    Workers Present
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={workersPresent}
                    onChange={(e) => setWorkersPresent(e.target.value ? Number(e.target.value) : "")}
                    placeholder="e.g. 15"
                    style={{
                      width: "100%", padding: "10px 14px", fontSize: "var(--text-base)",
                      borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)",
                      background: "var(--color-bg-input)", color: "var(--color-text-primary)", outline: "none"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>
                  Work Completed <span style={{ color: "var(--color-destructive)" }}>*</span>
                </label>
                <textarea
                  value={workCompleted}
                  onChange={(e) => setWorkCompleted(e.target.value)}
                  placeholder="Describe the tasks finished today..."
                  required
                  style={{
                    width: "100%", minHeight: 100, padding: "12px 14px", fontSize: "var(--text-sm)",
                    borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)",
                    background: "var(--color-bg-input)", color: "var(--color-text-primary)", outline: "none", resize: "vertical"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>
                  Materials Received (Optional)
                </label>
                <textarea
                  value={materialsReceived}
                  onChange={(e) => setMaterialsReceived(e.target.value)}
                  placeholder="List any major deliveries..."
                  style={{
                    width: "100%", minHeight: 60, padding: "12px 14px", fontSize: "var(--text-sm)",
                    borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)",
                    background: "var(--color-bg-input)", color: "var(--color-text-primary)", outline: "none", resize: "vertical"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>
                  Issues or Blockers (Optional)
                </label>
                <textarea
                  value={mistakesOrIssues}
                  onChange={(e) => setMistakesOrIssues(e.target.value)}
                  placeholder="Any delays, accidents, or clarifications needed..."
                  style={{
                    width: "100%", minHeight: 60, padding: "12px 14px", fontSize: "var(--text-sm)",
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
                  disabled={!workCompleted.trim()}
                  style={{
                    flex: 1, padding: "12px", borderRadius: "var(--radius-sm)",
                    background: workCompleted.trim() ? "var(--color-accent)" : "var(--color-bg-input)",
                    color: workCompleted.trim() ? "#fff" : "var(--color-text-muted)",
                    border: "none", fontSize: "var(--text-sm)", fontWeight: 500, cursor: workCompleted.trim() ? "pointer" : "not-allowed"
                  }}
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {contractorReports.length === 0 ? (
          <div style={{ textAlign: "center", padding: 64, color: "var(--color-text-muted)", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
            <ClipboardCheck size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
            <p style={{ margin: 0, fontSize: "var(--text-base)" }}>No progress reports submitted yet.</p>
          </div>
        ) : (
          contractorReports.map((report) => (
            <div key={report.id} style={{
              background: "var(--color-bg-card)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)", padding: 24, display: "flex", flexDirection: "column", gap: 16
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-accent-muted)", color: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      Report for {format(new Date(report.date), "MMMM d, yyyy")}
                    </h3>
                    <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      Submitted on {format(new Date(report.createdAt), "MMM d 'at' h:mm a")}
                    </p>
                  </div>
                </div>
                {report.workersPresent && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-text-primary)" }}>
                      {report.workersPresent}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                      Workers
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Work Completed</h4>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-primary)", lineHeight: 1.5 }}>{report.workCompleted}</p>
                </div>
                
                {report.materialsReceived && (
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Materials Received</h4>
                    <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-primary)", lineHeight: 1.5 }}>{report.materialsReceived}</p>
                  </div>
                )}
                
                {report.mistakesOrIssues && (
                  <div style={{ background: "var(--color-warning-muted)", padding: 12, borderRadius: "var(--radius-sm)", borderLeft: "2px solid var(--color-warning)" }}>
                    <h4 style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-warning)", textTransform: "uppercase" }}>Issues / Blockers</h4>
                    <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-primary)", lineHeight: 1.5 }}>{report.mistakesOrIssues}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
