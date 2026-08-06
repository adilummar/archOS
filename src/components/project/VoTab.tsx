"use client";
/**
 * VoTab — Variation Orders (4.15)
 * VO lifecycle: draft → pending_client → approved/rejected
 * Admin/lead can advance status. Impact amounts shown prominently.
 */

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { GitMerge, ArrowRight } from "lucide-react";
import { useVoStore } from "../../lib/store/vo.store";
import { useAuthStore } from "../../lib/store/auth.store";
import { StatusBadge } from "../shared/StatusBadge";
import { toast } from "../../lib/store/toast.store";
import type { Project } from "../../lib/store/types";

export function VoTab({ project }: { project: Project }) {
  const { variationOrders, sendToClient, clientApprove, clientReject } = useVoStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const projectVos = variationOrders.filter((v) => v.projectId === project.id);
  const canDecide = user?.role === "admin" || user?.role === "team_lead";

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{ height: 100, background: "var(--color-bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
          />
        ))}
      </div>
    );
  }

  if (projectVos.length === 0) {
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
        <GitMerge size={40} strokeWidth={1} opacity={0.4} />
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text-secondary)" }}>
            No variation orders
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)" }}>
            Variation orders capture approved changes to scope, fee, or timeline beyond the original contract.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {projectVos.map((vo) => (
        <div
          key={vo.id}
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-xs)",
                    color: "var(--color-accent)",
                    fontWeight: 600,
                  }}
                >
                  {vo.voNumber}
                </span>
                <h4
                  style={{
                    margin: 0,
                    fontSize: "var(--text-sm)",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {vo.title}
                </h4>
              </div>
              <p style={{ margin: "3px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                Created {format(parseISO(vo.createdAt), "d MMM yyyy")}
              </p>
            </div>
            <StatusBadge status={vo.status} size="sm" />
          </div>

          {/* Description */}
          {vo.description && (
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              {vo.description}
            </p>
          )}

          {/* Impact badges */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {vo.feeImpactAmount !== 0 && (
              <span
                style={{
                  background: vo.feeImpactAmount > 0 ? "rgba(217,160,58,0.1)" : "rgba(229,82,48,0.1)",
                  border: `1px solid ${vo.feeImpactAmount > 0 ? "rgba(217,160,58,0.3)" : "rgba(229,82,48,0.3)"}`,
                  color: vo.feeImpactAmount > 0 ? "var(--color-warning)" : "var(--color-destructive)",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 10px",
                  fontSize: "var(--text-xs)",
                  fontWeight: 500,
                }}
              >
                Fee {vo.feeImpactAmount > 0 ? "+" : ""}₹{(vo.feeImpactAmount / 1000).toFixed(1)}K
              </span>
            )}
            {vo.timelineImpactDays !== 0 && (
              <span
                style={{
                  background: "rgba(217,160,58,0.1)",
                  border: "1px solid rgba(217,160,58,0.3)",
                  color: "var(--color-warning)",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 10px",
                  fontSize: "var(--text-xs)",
                  fontWeight: 500,
                }}
              >
                Timeline {vo.timelineImpactDays > 0 ? "+" : ""}{vo.timelineImpactDays}d
              </span>
            )}
          </div>

          {/* Status progression */}
          {canDecide && (
            <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
              {vo.status === "draft" && (
                <button
                  onClick={() => {
                    sendToClient(vo.id);
                    toast(`${vo.voNumber} sent for client approval`, "success");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: "var(--color-accent)",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    color: "#fff",
                    fontSize: "var(--text-xs)",
                    fontWeight: 500,
                    padding: "6px 14px",
                    cursor: "pointer",
                  }}
                >
                  Send to Client
                  <ArrowRight size={12} />
                </button>
              )}
              {vo.status === "pending_client" && (
                <>
                  <button
                    onClick={() => {
                      clientApprove(vo.id);
                      toast(`${vo.voNumber} approved — fee and timeline updated`, "success");
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
                      padding: "6px 14px",
                      cursor: "pointer",
                    }}
                  >
                    Client Approved
                  </button>
                  <button
                    onClick={() => {
                      clientReject(vo.id, "Client declined");
                      toast(`${vo.voNumber} rejected`, "default");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: "transparent",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--color-text-muted)",
                      fontSize: "var(--text-xs)",
                      padding: "6px 14px",
                      cursor: "pointer",
                    }}
                  >
                    Client Rejected
                  </button>
                </>
              )}
              {vo.status === "approved" && (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-success)", fontWeight: 500 }}>
                  ✓ Approved — project fee and timeline updated
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
