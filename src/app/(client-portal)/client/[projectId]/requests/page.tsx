"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useRequestStore } from "@/lib/store/request.store";
import { useRfiStore } from "@/lib/store/rfi.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { format } from "date-fns";
import { FileQuestion, MessageCircleQuestion } from "lucide-react";

export default function ClientRequestsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const { fileRequests } = useRequestStore();
  const { rfis } = useRfiStore();
  const { portalSession } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"files" | "rfis">("files");

  if (!portalSession) return null;

  // Filter for this project and this client
  const clientFileRequests = fileRequests
    .filter((req) => req.projectId === projectId && req.requestedById === portalSession.entityId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const clientRfis = rfis
    .filter((rfi) => rfi.projectId === projectId && rfi.raisedById === portalSession.entityId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
          My Requests
        </h1>
        <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>
          Track the status of your file requests and information inquiries.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 32, borderBottom: "1px solid var(--color-border)" }}>
        <button
          onClick={() => setActiveTab("files")}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            padding: "0 0 12px 0", fontSize: "var(--text-sm)", fontWeight: 600,
            color: activeTab === "files" ? "var(--color-accent)" : "var(--color-text-muted)",
            borderBottom: activeTab === "files" ? "2px solid var(--color-accent)" : "2px solid transparent",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <FileQuestion size={16} /> File Requests ({clientFileRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("rfis")}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            padding: "0 0 12px 0", fontSize: "var(--text-sm)", fontWeight: 600,
            color: activeTab === "rfis" ? "var(--color-accent)" : "var(--color-text-muted)",
            borderBottom: activeTab === "rfis" ? "2px solid var(--color-accent)" : "2px solid transparent",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <MessageCircleQuestion size={16} /> RFIs ({clientRfis.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === "files" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {clientFileRequests.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--color-text-muted)" }}>
              <p style={{ fontSize: "var(--text-base)" }}>You haven't made any file requests yet.</p>
            </div>
          ) : (
            clientFileRequests.map((req) => (
              <div key={req.id} style={{
                background: "var(--color-bg-card)", border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)", padding: 24, display: "flex", flexDirection: "column", gap: 16
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 500, color: "var(--color-text-primary)" }}>
                      {req.description}
                    </h3>
                    <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      Requested on {format(new Date(req.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                
                {req.status === 'fulfilled' && req.fulfilledAt && (
                  <div style={{ background: "var(--color-success-muted)", padding: 12, borderRadius: "var(--radius-sm)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                    <strong>Fulfilled:</strong> The file is now available in your Files tab.
                  </div>
                )}
                {req.status === 'rejected' && req.rejectionNote && (
                  <div style={{ background: "var(--color-destructive-muted)", padding: 12, borderRadius: "var(--radius-sm)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                    <strong>Rejected:</strong> {req.rejectionNote}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "rfis" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {clientRfis.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--color-text-muted)" }}>
              <p style={{ fontSize: "var(--text-base)" }}>You haven't submitted any RFIs.</p>
            </div>
          ) : (
            clientRfis.map((rfi) => (
              <div key={rfi.id} style={{
                background: "var(--color-bg-card)", border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)", padding: 24, display: "flex", flexDirection: "column", gap: 16
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", background: "var(--color-bg-canvas)", padding: "2px 6px", borderRadius: 4 }}>
                        {rfi.rfiNumber}
                      </span>
                      <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {rfi.title}
                      </h3>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {rfi.description}
                    </p>
                  </div>
                  <StatusBadge status={rfi.status} />
                </div>
                
                {rfi.status === 'responded' || rfi.status === 'closed' ? (
                  <div style={{ background: "var(--color-bg-canvas)", borderLeft: "2px solid var(--color-success)", padding: "12px 16px", fontSize: "var(--text-sm)" }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 600, color: "var(--color-text-primary)" }}>Architect's Response:</p>
                    <p style={{ margin: 0, color: "var(--color-text-secondary)", fontStyle: "italic" }}>
                      "{rfi.responseText}"
                    </p>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
