"use client";
/**
 * RFI Tab — project detail.
 * Tasks 4.11: list open/responded/closed RFIs for this project.
 * Admin/team_lead: inline response textarea + respond button.
 * Auto-numbered RFI-001, RFI-002 per project.
 */

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { MessageSquare, Plus, Send, X, Check } from "lucide-react";
import { useRfiStore } from "../../lib/store/rfi.store";
import { useAuthStore } from "../../lib/store/auth.store";
import { useFirmStore } from "../../lib/store/firm.store";
import { StatusBadge } from "../shared/StatusBadge";
import { toast } from "../../lib/store/toast.store";
import type { Project, RFI } from "../../lib/store/types";

const PRIORITY_DOT: Record<string, string> = {
  low: "var(--color-text-muted)",
  medium: "var(--color-warning)",
  high: "var(--color-accent)",
  urgent: "var(--color-destructive)",
};

function RfiRow({
  rfi,
  canRespond,
  userId,
}: {
  rfi: RFI;
  canRespond: boolean;
  userId: string;
}) {
  const { respond, close } = useRfiStore();
  const { users } = useFirmStore();
  const [responding, setResponding] = useState(false);
  const [responseText, setResponseText] = useState(rfi.responseText ?? "");

  const responder = rfi.respondedById
    ? users.find((u) => u.id === rfi.respondedById)?.name
    : null;

  const handleRespond = () => {
    if (!responseText.trim()) return;
    respond(rfi.id, {
      respondedById: userId,
      responseText: responseText.trim(),
      status: "responded",
    });
    toast("RFI response submitted", "success");
    setResponding(false);
  };

  const handleClose = () => {
    close(rfi.id, userId);
    toast(`${rfi.rfiNumber} closed`, "default");
  };

  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: PRIORITY_DOT[rfi.priority] ?? "var(--color-text-muted)",
              flexShrink: 0,
              marginTop: 2,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-accent)",
                  fontWeight: 600,
                }}
              >
                {rfi.rfiNumber}
              </span>
              <h4
                style={{
                  margin: 0,
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {rfi.title}
              </h4>
            </div>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "var(--text-xs)",
                color: "var(--color-text-muted)",
              }}
            >
              Raised by {rfi.raiserName} · {format(parseISO(rfi.createdAt), "d MMM yyyy")}
              {rfi.responseRequiredBy && (
                <> · Due {format(parseISO(rfi.responseRequiredBy), "d MMM")}</>
              )}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <StatusBadge status={rfi.status} size="sm" />
          {canRespond && rfi.status === "responded" && (
            <button
              onClick={handleClose}
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text-muted)",
                fontSize: "var(--text-xs)",
                padding: "4px 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-text-primary)";
                e.currentTarget.style.borderColor = "var(--color-border-strong)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-text-muted)";
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              <Check size={12} />
              Mark Closed
            </button>
          )}
          {canRespond && rfi.status === "open" && !responding && (
            <button
              onClick={() => setResponding(true)}
              style={{
                background: "var(--color-accent)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                color: "#fff",
                fontSize: "var(--text-xs)",
                padding: "4px 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 500,
              }}
            >
              <Send size={12} />
              Respond
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {rfi.description && (
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--color-text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {rfi.description}
        </p>
      )}

      {/* Existing response */}
      {rfi.responseText && (
        <div
          style={{
            background: "var(--color-bg-input)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 14px",
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--color-text-muted)",
            }}
          >
            Response {responder ? `by ${responder}` : ""}{" "}
            {rfi.respondedAt && `· ${format(parseISO(rfi.respondedAt), "d MMM yyyy")}`}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-sm)",
              color: "var(--color-text-secondary)",
              lineHeight: 1.5,
            }}
          >
            {rfi.responseText}
          </p>
        </div>
      )}

      {/* Response form */}
      {responding && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Write your response to this RFI…"
            rows={3}
            style={{
              width: "100%",
              background: "var(--color-bg-input)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-text-primary)",
              fontSize: "var(--text-sm)",
              padding: "10px 12px",
              resize: "vertical",
              outline: "none",
              fontFamily: "var(--font-body)",
              lineHeight: 1.5,
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={() => setResponding(false)}
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text-muted)",
                fontSize: "var(--text-xs)",
                padding: "6px 14px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleRespond}
              disabled={!responseText.trim()}
              style={{
                background: "var(--color-accent)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                color: "#fff",
                fontSize: "var(--text-xs)",
                padding: "6px 14px",
                cursor: responseText.trim() ? "pointer" : "not-allowed",
                opacity: responseText.trim() ? 1 : 0.5,
                fontWeight: 500,
              }}
            >
              Submit Response
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RfiTab({ project }: { project: Project }) {
  const { rfis } = useRfiStore();
  const { user, firm } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "responded" | "closed">("all");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const projectRfis = rfis
    .filter((r) => r.projectId === project.id)
    .filter((r) => (filterStatus === "all" ? true : r.status === filterStatus));

  const canRespond =
    user?.role === "admin" || user?.role === "team_lead";

  const counts = {
    all: rfis.filter((r) => r.projectId === project.id).length,
    open: rfis.filter((r) => r.projectId === project.id && r.status === "open").length,
    responded: rfis.filter((r) => r.projectId === project.id && r.status === "responded").length,
    closed: rfis.filter((r) => r.projectId === project.id && r.status === "closed").length,
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 100,
              background: "var(--color-bg-card)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 16, borderBottom: "1px solid var(--color-border)" }}>
          {(["all", "open", "responded", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: filterStatus === s ? "2px solid var(--color-accent)" : "2px solid transparent",
                color: filterStatus === s ? "var(--color-text-primary)" : "var(--color-text-muted)",
                padding: "6px 0",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: -1,
                textTransform: "capitalize",
              }}
            >
              {s === "all" ? "All" : s}
              <span
                style={{
                  background: filterStatus === s ? "var(--color-accent-muted)" : "var(--color-bg-subtle)",
                  color: filterStatus === s ? "var(--color-accent)" : "var(--color-text-muted)",
                  padding: "1px 6px",
                  borderRadius: 10,
                  fontSize: 10,
                }}
              >
                {counts[s]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {projectRfis.length === 0 ? (
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
          <MessageSquare size={40} strokeWidth={1} opacity={0.4} />
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text-secondary)" }}>
              No RFIs {filterStatus !== "all" ? `with status "${filterStatus}"` : "for this project"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)" }}>
              Contractors raise RFIs when they need clarification on drawings or specifications.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {projectRfis.map((rfi) => (
            <RfiRow
              key={rfi.id}
              rfi={rfi}
              canRespond={canRespond}
              userId={user?.id ?? ""}
            />
          ))}
        </div>
      )}
    </div>
  );
}
