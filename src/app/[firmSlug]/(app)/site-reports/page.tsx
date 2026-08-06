"use client";
/**
 * Site Reports Page — Phase 6.5
 * Firm-wide daily site reports. Filter by project.
 * Submit new report form (for staff in the field).
 * Admin/lead see all; staff see their own submitted.
 */

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import {
  FileText,
  Plus,
  ChevronDown,
  Cloud,
  Users,
  Package,
  X,
  AlertTriangle,
} from "lucide-react";
import { useSitereportStore } from "@/lib/store/sitereport.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { Avatar } from "@/components/shared/Avatar";
import { toast } from "@/lib/store/toast.store";
import type { DailySiteReport } from "@/lib/store/types";

function dateLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "d MMM yyyy");
}

export default function SiteReportsPage() {
  const params = useParams<{ firmSlug: string }>();
  const { reports, add } = useSitereportStore();
  const { projects } = useProjectStore();
  const { user, firm } = useAuthStore();
  const { users } = useFirmStore();

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [projectFilter, setProjectFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formProjectId, setFormProjectId] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formWeather, setFormWeather] = useState("");
  const [formWorkCompleted, setFormWorkCompleted] = useState("");
  const [formMistakes, setFormMistakes] = useState("");
  const [formMaterials, setFormMaterials] = useState("");
  const [formWorkers, setFormWorkers] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const firmProjects = useMemo(
    () => projects.filter((p) => p.firmId === firm?.id),
    [projects, firm]
  );

  const firmReports = useMemo(() => {
    if (!firm) return [];
    let result = reports.filter((r) => r.firmId === firm.id);
    // Staff see only their own reports
    if (user?.role === "staff") {
      result = result.filter((r) => r.reportedById === user.id);
    }
    if (projectFilter !== "all") {
      result = result.filter((r) => r.projectId === projectFilter);
    }
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [reports, firm, user, projectFilter]);

  const getProject = (projectId: string) =>
    firmProjects.find((p) => p.id === projectId);

  const getReporter = (userId: string) =>
    users.find((u) => u.id === userId);

  const handleSubmit = () => {
    if (!user || !firm) return;
    if (!formProjectId) {
      toast("Select a project", "error");
      return;
    }
    if (!formWorkCompleted.trim()) {
      toast("Describe work completed", "error");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      add({
        firmId: firm.id,
        projectId: formProjectId,
        date: formDate,
        reportedById: user.id,
        weather: formWeather || undefined,
        workCompleted: formWorkCompleted.trim(),
        mistakesOrIssues: formMistakes.trim() || undefined,
        materialsReceived: formMaterials.trim() || undefined,
        workersPresent: formWorkers ? parseInt(formWorkers, 10) : undefined,
      });
      toast("Site report submitted", "success");
      setShowForm(false);
      setFormProjectId("");
      setFormDate(new Date().toISOString().slice(0, 10));
      setFormWeather("");
      setFormWorkCompleted("");
      setFormMistakes("");
      setFormMaterials("");
      setFormWorkers("");
      setSubmitting(false);
    }, 200);
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--color-bg-input)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--color-text-primary)",
    fontSize: "var(--text-sm)",
    padding: "9px 12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  if (loading) {
    return (
      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 200, height: 32, background: "var(--color-bg-card)", borderRadius: "var(--radius-md)" }} />
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: 88,
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        background: "var(--color-bg-canvas)",
        minHeight: "100%",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-text-primary)" }}>
            Site Reports
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Daily field updates and progress logs
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "var(--color-accent)",
            border: "none",
            borderRadius: "var(--radius-md)",
            color: "#fff",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            padding: "9px 16px",
            cursor: "pointer",
          }}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancel" : "New Report"}
        </button>
      </div>

      {/* Submit form */}
      {showForm && (
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-primary)" }}>
            Submit Daily Site Report
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: 6 }}>
                Project *
              </label>
              <select
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              >
                <option value="">Select project…</option>
                {firmProjects.filter(p => p.status === "active").map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: 6 }}>
                Date *
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: 6 }}>
                Weather
              </label>
              <input
                type="text"
                placeholder="e.g. Clear, Hot"
                value={formWeather}
                onChange={(e) => setFormWeather(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: 6 }}>
              Work Completed *
            </label>
            <textarea
              placeholder="Describe work done on site today…"
              value={formWorkCompleted}
              onChange={(e) => setFormWorkCompleted(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: 6 }}>
                Issues / Mistakes
              </label>
              <textarea
                placeholder="Any problems on site…"
                value={formMistakes}
                onChange={(e) => setFormMistakes(e.target.value)}
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: 6 }}>
                Materials Received
              </label>
              <textarea
                placeholder="Materials delivered today…"
                value={formMaterials}
                onChange={(e) => setFormMaterials(e.target.value)}
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", marginBottom: 6 }}>
                Workers on Site
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formWorkers}
                onChange={(e) => setFormWorkers(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={() => setShowForm(false)}
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text-secondary)",
                fontSize: "var(--text-sm)",
                padding: "8px 18px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                background: "var(--color-accent)",
                border: "none",
                borderRadius: "var(--radius-md)",
                color: "#fff",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                padding: "8px 18px",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              Submit Report
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          style={{
            background: "var(--color-bg-input)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-text-primary)",
            fontSize: "var(--text-sm)",
            padding: "7px 12px",
            outline: "none",
            cursor: "pointer",
            maxWidth: 220,
          }}
        >
          <option value="all">All Projects</option>
          {firmProjects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <span
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "4px 10px",
          }}
        >
          {firmReports.length} report{firmReports.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Reports list */}
      {firmReports.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 0",
            gap: 12,
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text-muted)",
          }}
        >
          <FileText size={40} strokeWidth={1} opacity={0.4} />
          <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text-secondary)" }}>
            No site reports yet
          </p>
          <p style={{ margin: 0, fontSize: "var(--text-xs)" }}>
            Submit your first daily report from the field to begin tracking progress.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {firmReports.map((report) => {
            const project = getProject(report.projectId);
            const reporter = getReporter(report.reportedById);
            const isExpanded = expandedId === report.id;

            return (
              <div
                key={report.id}
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  transition: "box-shadow var(--duration-fast)",
                }}
              >
                {/* Report header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 18px",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-card-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Date chip */}
                  <div
                    style={{
                      background: "var(--color-bg-input)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "4px 10px",
                      fontSize: "var(--text-xs)",
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                      whiteSpace: "nowrap",
                      minWidth: 80,
                      textAlign: "center",
                    }}
                  >
                    {dateLabel(report.date)}
                  </div>

                  {/* Project */}
                  {project && (
                    <span
                      style={{
                        background: "var(--color-accent-muted)",
                        border: "1px solid var(--color-accent)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--color-accent)",
                        fontSize: "var(--text-xs)",
                        padding: "3px 8px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {project.name}
                    </span>
                  )}

                  {/* Work completed preview */}
                  <p
                    style={{
                      margin: 0,
                      flex: 1,
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {report.workCompleted}
                  </p>

                  {/* Meta */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    {report.workersPresent != null && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
                        <Users size={12} />
                        <span>{report.workersPresent}</span>
                      </div>
                    )}
                    {report.mistakesOrIssues && (
                      <AlertTriangle size={14} color="var(--color-warning)" />
                    )}
                    {reporter && (
                      <Avatar name={reporter.name} size="sm" color={reporter.avatarColor} />
                    )}
                    <ChevronDown
                      size={14}
                      color="var(--color-text-muted)"
                      style={{
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform var(--duration-fast)",
                      }}
                    />
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div
                    style={{
                      borderTop: "1px solid var(--color-border)",
                      padding: "18px 18px 18px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                    {/* Left column */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <p style={{ margin: "0 0 6px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Work Completed
                        </p>
                        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-primary)", lineHeight: 1.6 }}>
                          {report.workCompleted}
                        </p>
                      </div>

                      {report.mistakesOrIssues && (
                        <div>
                          <p style={{ margin: "0 0 6px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-warning)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Issues / Mistakes
                          </p>
                          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                            {report.mistakesOrIssues}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right column */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {report.materialsReceived && (
                        <div>
                          <p style={{ margin: "0 0 6px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Materials Received
                          </p>
                          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                            {report.materialsReceived}
                          </p>
                        </div>
                      )}

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                        {report.weather && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Cloud size={14} color="var(--color-text-muted)" />
                            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                              {report.weather}
                            </span>
                          </div>
                        )}
                        {report.workersPresent != null && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Users size={14} color="var(--color-text-muted)" />
                            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                              {report.workersPresent} worker{report.workersPresent !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto" }}>
                        {reporter && (
                          <>
                            <Avatar name={reporter.name} size="sm" color={reporter.avatarColor} />
                            <div>
                              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontWeight: 500 }}>
                                {reporter.name}
                              </p>
                              <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-muted)" }}>
                                {format(parseISO(report.createdAt), "d MMM yyyy, h:mm a")}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
