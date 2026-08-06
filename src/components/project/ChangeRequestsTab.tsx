"use client";
/**
 * ChangeRequestsTab — project detail (4.14)
 * Shows change requests from contractors. Admin/lead can approve or reject inline.
 */

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { GitPullRequest, Clock, AlertTriangle, DollarSign, Check, X } from "lucide-react";
import { useRequestStore } from "../../lib/store/request.store";
import { useAuthStore } from "../../lib/store/auth.store";
import { StatusBadge } from "../shared/StatusBadge";
import { toast } from "../../lib/store/toast.store";
import type { Project } from "../../lib/store/types";

export function ChangeRequestsTab({ project }: { project: Project }) {
  const { fileRequests, fulfill, reject } = useRequestStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const projectRequests = fileRequests.filter(
    (r) => r.projectId === project.id
  );

  const canDecide = user?.role === "admin" || user?.role === "team_lead";

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{ height: 80, background: "var(--color-bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
          />
        ))}
      </div>
    );
  }

  if (projectRequests.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 0",
          gap: 12,
          color: "var(--color-text-muted)",
        }}
      >
        <GitPullRequest size={40} strokeWidth={1} opacity={0.4} />
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text-secondary)" }}>
            No file requests
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)" }}>
            Client and contractor file requests appear here. Fulfill them to share the relevant drawing or document.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {projectRequests.map((req) => (
        <div
          key={req.id}
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderLeft: `3px solid ${
              req.status === "pending"
                ? "var(--color-warning)"
                : req.status === "fulfilled"
                ? "var(--color-success)"
                : "var(--color-destructive)"
            }`,
            borderRadius: "var(--radius-md)",
            padding: "14px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                {req.description}
              </p>
              <p style={{ margin: "3px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                Requested by {req.requesterName} ({req.requesterType}) ·{" "}
                {format(parseISO(req.createdAt), "d MMM yyyy")}
                {req.responseDueDate && (
                  <> · Due {format(parseISO(req.responseDueDate), "d MMM")}</>
                )}
              </p>
            </div>
            <StatusBadge status={req.status} size="sm" />
          </div>

          {req.rejectionNote && (
            <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-destructive)", fontStyle: "italic" }}>
              Rejected: {req.rejectionNote}
            </p>
          )}

          {canDecide && req.status === "pending" && (
            <>
              {rejectingId === req.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    placeholder="Reason for rejection…"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    style={{
                      background: "var(--color-bg-input)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--color-text-primary)",
                      fontSize: "var(--text-sm)",
                      padding: "7px 12px",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => {
                        reject(req.id, user?.id ?? "", rejectNote);
                        toast("Request rejected", "default");
                        setRejectingId(null);
                        setRejectNote("");
                      }}
                      style={{
                        background: "var(--color-destructive)",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        color: "#fff",
                        fontSize: "var(--text-xs)",
                        fontWeight: 500,
                        padding: "5px 14px",
                        cursor: "pointer",
                      }}
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => { setRejectingId(null); setRejectNote(""); }}
                      style={{
                        background: "transparent",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--color-text-muted)",
                        fontSize: "var(--text-xs)",
                        padding: "5px 12px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      fulfill(req.id, { fulfilledById: user?.id ?? "", fulfilledFileId: "demo" });
                      toast("Request marked as fulfilled", "success");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: "transparent",
                      border: "1px solid var(--color-success)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--color-success)",
                      fontSize: "var(--text-xs)",
                      fontWeight: 500,
                      padding: "5px 12px",
                      cursor: "pointer",
                    }}
                  >
                    <Check size={12} />
                    Mark Fulfilled
                  </button>
                  <button
                    onClick={() => setRejectingId(req.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: "transparent",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--color-text-muted)",
                      fontSize: "var(--text-xs)",
                      padding: "5px 12px",
                      cursor: "pointer",
                    }}
                  >
                    <X size={12} />
                    Reject
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
