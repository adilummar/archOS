"use client";
/**
 * ActivityTab — project detail (4.18)
 * Chronological activity log for this project from activity store.
 */

import { useState, useEffect } from "react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";
import { useActivityStore } from "../../lib/store/activity.store";
import { Avatar } from "../shared/Avatar";
import type { Project } from "../../lib/store/types";

const ENTITY_LABELS: Record<string, string> = {
  task: "Task",
  file: "File",
  rfi: "RFI",
  punchlist: "Punch List",
  sitereport: "Site Report",
  meeting: "Meeting",
  invoice: "Invoice",
  expense: "Expense",
  vo: "Variation Order",
  file_request: "File Request",
  chat: "Chat",
  project: "Project",
  leave: "Leave",
  salary: "Salary",
};

export function ActivityTab({ project }: { project: Project }) {
  const { logs } = useActivityStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const projectLogs = logs
    .filter((l) => l.projectId === project.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              height: 48,
              background: "var(--color-bg-card)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
            }}
          />
        ))}
      </div>
    );
  }

  if (projectLogs.length === 0) {
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
        <Activity size={40} strokeWidth={1} opacity={0.4} />
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text-secondary)" }}>
            No activity yet
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)" }}>
            All actions on this project are recorded here automatically.
          </p>
        </div>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, typeof projectLogs> = {};
  projectLogs.forEach((log) => {
    const date = log.createdAt.slice(0, 10);
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(log);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {Object.entries(grouped).map(([date, dateLogs]) => (
        <div key={date}>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {format(parseISO(date), "EEEE, d MMMM yyyy")}
          </p>
          <div
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            {dateLogs.map((log, i) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom:
                    i < dateLogs.length - 1 ? "1px solid var(--color-border)" : "none",
                  alignItems: "flex-start",
                }}
              >
                {/* Avatar */}
                <Avatar name={log.userName} size="sm" />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                    <strong style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
                      {log.userName}
                    </strong>{" "}
                    {log.description}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    {ENTITY_LABELS[log.entity] ?? log.entity} ·{" "}
                    {format(parseISO(log.createdAt), "h:mm a")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
