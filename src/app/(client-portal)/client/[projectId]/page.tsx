"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useProjectStore } from "@/lib/store/project.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card } from "@/components/shared/Card"; // Will need to define or replace with standard div
import { toast } from "@/lib/store/toast.store";
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, MessageSquareX } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

export default function ClientOverviewPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;
  const { projects, approveStageApproval, requestStageRevision } = useProjectStore();
  const { firms } = useFirmStore();
  
  const project = projects.find((p) => p.id === projectId);
  const firm = firms.find((f) => f.id === project?.firmId);
  
  const [revisionNote, setRevisionNote] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  if (!project || !firm) return null;

  const currentStageIndex = project.stages.findIndex(s => s.id === project.currentStageId);
  const currentStage = project.stages[currentStageIndex];
  const nextStage = project.stages[currentStageIndex + 1];
  
  // Find if there is a pending approval stage. It might be the current stage if it's awaiting approval.
  const pendingApprovalStage = project.stages.find(
    s => s.isClientApprovalRequired && s.clientApprovalStatus === 'pending'
  );

  const isApprovalOverdue = pendingApprovalStage?.clientApprovalRequestedAt
    ? differenceInDays(new Date(), parseISO(pendingApprovalStage.clientApprovalRequestedAt)) > firm.settings.clientApprovalReminderDays
    : false;

  const handleApprove = (stageId: string) => {
    approveStageApproval(project.id, stageId);
    toast("Stage approved successfully. The project will now proceed.", "success");
  };

  const handleRequestRevision = (stageId: string) => {
    if (!revisionNote.trim()) {
      toast("Please provide details for the revision request.", "error");
      return;
    }
    requestStageRevision(project.id, stageId, revisionNote);
    setShowRevisionForm(false);
    setRevisionNote("");
    toast("Revision request sent to the architect.", "success");
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
          {project.name}
        </h1>
        <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
          Project Overview & Timeline
        </p>
      </div>

      {/* Overdue Banner */}
      {pendingApprovalStage && isApprovalOverdue && (
        <div style={{
          background: "var(--color-warning-muted)",
          border: "1px solid var(--color-warning)",
          borderRadius: "var(--radius-md)",
          padding: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <AlertTriangle style={{ color: "var(--color-warning)" }} />
          <div>
            <h3 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
              Approval Overdue
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              The <strong>{pendingApprovalStage.name}</strong> stage has been awaiting your approval for more than {firm.settings.clientApprovalReminderDays} days. Please review and approve to keep the project on track.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32, alignItems: "start" }}>
        
        {/* Left Col: Timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
            Project Stages
          </h2>
          
          <div style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}>
            {project.stages.map((stage, idx) => {
              const isPast = idx < currentStageIndex || (stage.id === currentStage?.id && stage.status === "completed" && stage.clientApprovalStatus !== "pending");
              const isCurrent = stage.id === currentStage?.id && (stage.status !== "completed" || stage.clientApprovalStatus === "pending");
              const isFuture = idx > currentStageIndex;
              
              const showConnector = idx !== project.stages.length - 1;

              return (
                <div key={stage.id} style={{ display: "flex", gap: 16, minHeight: 80 }}>
                  
                  {/* Timeline Indicator */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: isPast ? "var(--color-success)" : isCurrent ? "var(--color-accent)" : "var(--color-bg-input)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isPast || isCurrent ? "#fff" : "var(--color-text-muted)",
                      zIndex: 2,
                      boxShadow: isCurrent ? "0 0 0 4px var(--color-accent-muted)" : "none",
                    }}>
                      {isPast ? <CheckCircle2 size={14} /> : <span style={{ fontSize: 10, fontWeight: 700 }}>{idx + 1}</span>}
                    </div>
                    {showConnector && (
                      <div style={{
                        flex: 1,
                        width: 2,
                        background: isPast ? "var(--color-success)" : "var(--color-border)",
                        margin: "4px 0",
                      }} />
                    )}
                  </div>

                  {/* Stage Details */}
                  <div style={{ flex: 1, paddingBottom: 24, opacity: isFuture ? 0.6 : 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <h3 style={{ fontSize: "var(--text-base)", fontWeight: isCurrent ? 700 : 500, color: "var(--color-text-primary)", margin: 0 }}>
                        {stage.name}
                      </h3>
                      {isPast && <StatusBadge status="completed" />}
                      {isCurrent && stage.clientApprovalStatus === 'pending' && <StatusBadge status="pending" label="Needs Approval" />}
                      {isCurrent && stage.clientApprovalStatus !== 'pending' && <StatusBadge status="in_progress" />}
                      {isFuture && <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Upcoming</span>}
                    </div>
                    {stage.description && (
                      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {stage.description}
                      </p>
                    )}

                    {/* Stage Gate Action Box (if current and needs approval) */}
                    {isCurrent && stage.clientApprovalStatus === 'pending' && (
                      <div style={{
                        marginTop: 16,
                        background: "var(--color-bg-canvas)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        padding: 16,
                      }}>
                        <h4 style={{ margin: "0 0 8px", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                          Approval Required
                        </h4>
                        <p style={{ margin: "0 0 16px", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          The architect has submitted this stage for your review. Please approve to proceed to the next stage, or request a revision if changes are needed.
                        </p>
                        
                        {!showRevisionForm ? (
                          <div style={{ display: "flex", gap: 12 }}>
                            <button
                              onClick={() => handleApprove(stage.id)}
                              style={{
                                padding: "8px 16px",
                                borderRadius: "var(--radius-sm)",
                                background: "var(--color-success)",
                                color: "#fff",
                                border: "none",
                                fontSize: "var(--text-sm)",
                                fontWeight: 500,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <CheckCircle2 size={16} /> Approve & Proceed
                            </button>
                            <button
                              onClick={() => setShowRevisionForm(true)}
                              style={{
                                padding: "8px 16px",
                                borderRadius: "var(--radius-sm)",
                                background: "transparent",
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
                              <MessageSquareX size={16} /> Request Revision
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <textarea
                              value={revisionNote}
                              onChange={(e) => setRevisionNote(e.target.value)}
                              placeholder="Please describe what needs to be changed..."
                              style={{
                                width: "100%",
                                minHeight: 80,
                                padding: "10px 14px",
                                fontSize: "var(--text-sm)",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--color-border)",
                                background: "var(--color-bg-input)",
                                color: "var(--color-text-primary)",
                                resize: "vertical",
                                outline: "none",
                              }}
                              autoFocus
                            />
                            <div style={{ display: "flex", gap: 12 }}>
                              <button
                                onClick={() => handleRequestRevision(stage.id)}
                                disabled={!revisionNote.trim()}
                                style={{
                                  padding: "8px 16px",
                                  borderRadius: "var(--radius-sm)",
                                  background: revisionNote.trim() ? "var(--color-accent)" : "var(--color-bg-input)",
                                  color: revisionNote.trim() ? "#fff" : "var(--color-text-muted)",
                                  border: "none",
                                  fontSize: "var(--text-sm)",
                                  fontWeight: 500,
                                  cursor: revisionNote.trim() ? "pointer" : "not-allowed",
                                }}
                              >
                                Submit Revision Request
                              </button>
                              <button
                                onClick={() => setShowRevisionForm(false)}
                                style={{
                                  padding: "8px 16px",
                                  borderRadius: "var(--radius-sm)",
                                  background: "transparent",
                                  color: "var(--color-text-primary)",
                                  border: "1px solid var(--color-border)",
                                  fontSize: "var(--text-sm)",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Current Status & What's Next */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
          }}>
            <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-muted)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Current Status
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-info)", boxShadow: "0 0 0 4px var(--color-info-muted)" }} />
              <span style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                {currentStage?.name || "Completed"}
              </span>
            </div>
            {currentStage?.clientApprovalStatus === 'pending' ? (
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                Waiting for your approval to proceed to the next stage.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                Our team is currently working on this stage. We'll notify you when it's ready for review.
              </p>
            )}
          </div>

          {nextStage && (
            <div style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: 24,
            }}>
              <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-muted)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                What's Next
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <ArrowRight size={16} style={{ color: "var(--color-text-muted)" }} />
                <span style={{ fontSize: "var(--text-base)", fontWeight: 500, color: "var(--color-text-primary)" }}>
                  {nextStage.name}
                </span>
              </div>
              {nextStage.description && (
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", paddingLeft: 24 }}>
                  {nextStage.description}
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
