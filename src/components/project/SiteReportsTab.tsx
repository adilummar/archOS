"use client";
/**
 * SiteReportsTab — project detail (4.13)
 * List daily site reports; add new report form.
 */

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ClipboardList, Plus, Sun, Cloud, CloudRain, X } from "lucide-react";
import { useSitereportStore } from "../../lib/store/sitereport.store";
import { useAuthStore } from "../../lib/store/auth.store";
import { useFirmStore } from "../../lib/store/firm.store";
import { toast } from "../../lib/store/toast.store";
import type { Project } from "../../lib/store/types";

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  sunny: <Sun size={13} />,
  cloudy: <Cloud size={13} />,
  rainy: <CloudRain size={13} />,
};

function SiteReportCard({
  report,
  reporterName,
}: {
  report: ReturnType<typeof useSitereportStore.getState>["reports"][number];
  reporterName: string;
}) {
  return (
    <div
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {format(parseISO(report.date), "EEEE, d MMMM yyyy")}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            Reported by {reporterName}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "var(--text-xs)",
            color: "var(--color-text-muted)",
          }}
        >
          {report.weather && (
            <>
              {WEATHER_ICONS[report.weather.toLowerCase()] ?? null}
              <span style={{ textTransform: "capitalize" }}>{report.weather}</span>
            </>
          )}
          {report.workersPresent != null && (
            <span
              style={{
                marginLeft: 8,
                background: "var(--color-bg-input)",
                padding: "2px 8px",
                borderRadius: 10,
                fontSize: 10,
              }}
            >
              {report.workersPresent} workers
            </span>
          )}
        </div>
      </div>

      {/* Work completed */}
      <div>
        <p
          style={{
            margin: "0 0 4px",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Work Completed
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--color-text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {report.workCompleted}
        </p>
      </div>

      {/* Issues */}
      {report.mistakesOrIssues && (
        <div
          style={{
            padding: "10px 12px",
            background: "rgba(217,160,58,0.07)",
            border: "1px solid rgba(217,160,58,0.2)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--color-warning)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Issues / Mistakes
          </p>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
            {report.mistakesOrIssues}
          </p>
        </div>
      )}

      {/* Materials */}
      {report.materialsReceived && (
        <div>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Materials Received
          </p>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            {report.materialsReceived}
          </p>
        </div>
      )}
    </div>
  );
}

function AddReportForm({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const { add } = useSitereportStore();
  const { user, firm } = useAuthStore();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weather, setWeather] = useState("Sunny");
  const [workCompleted, setWorkCompleted] = useState("");
  const [issues, setIssues] = useState("");
  const [materials, setMaterials] = useState("");
  const [workers, setWorkers] = useState<number | "">(0);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--color-bg-input)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--color-text-primary)",
    fontSize: "var(--text-sm)",
    padding: "8px 12px",
    outline: "none",
    boxSizing: "border-box",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firm || !workCompleted) return;
    add({
      firmId: firm.id,
      projectId: project.id,
      date,
      reportedById: user.id,
      weather: weather || undefined,
      workCompleted: workCompleted.trim(),
      mistakesOrIssues: issues.trim() || undefined,
      materialsReceived: materials.trim() || undefined,
      workersPresent: workers !== "" ? workers : undefined,
    });
    toast("Site report submitted", "success");
    onClose();
  };

  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}
        >
          Submit Daily Site Report
        </h3>
        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}
        >
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
              Date
            </label>
            <input
              type="date"
              style={inputStyle}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>
          <div>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
              Weather
            </label>
            <select
              style={inputStyle}
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            >
              {["Sunny", "Cloudy", "Rainy", "Partly Cloudy"].map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
              Workers Present
            </label>
            <input
              type="number"
              min={0}
              style={inputStyle}
              value={workers}
              onChange={(e) => setWorkers(e.target.value === "" ? "" : Number(e.target.value))}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
            Work Completed *
          </label>
          <textarea
            style={{ ...inputStyle, resize: "vertical" }}
            rows={3}
            value={workCompleted}
            onChange={(e) => setWorkCompleted(e.target.value)}
            placeholder="Describe work carried out on site today…"
            required
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          />
        </div>

        <div>
          <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
            Issues / Mistakes (optional)
          </label>
          <textarea
            style={{ ...inputStyle, resize: "vertical" }}
            rows={2}
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
            placeholder="Any issues or deviations from plan…"
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          />
        </div>

        <div>
          <label style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 4 }}>
            Materials Received (optional)
          </label>
          <input
            style={inputStyle}
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
            placeholder="e.g., 200 bags cement, 5 tonnes steel"
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              padding: "7px 16px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              background: "var(--color-accent)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              color: "#fff",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              padding: "7px 18px",
              cursor: "pointer",
            }}
          >
            Submit Report
          </button>
        </div>
      </form>
    </div>
  );
}

export function SiteReportsTab({ project }: { project: Project }) {
  const { reports } = useSitereportStore();
  const { user } = useAuthStore();
  const { users } = useFirmStore();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const projectReports = reports
    .filter((r) => r.projectId === project.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{ height: 120, background: "var(--color-bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-primary)" }}>
          Daily Site Reports
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginLeft: 10, fontWeight: 400 }}>
            {projectReports.length} reports
          </span>
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--color-accent)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              color: "#fff",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              padding: "7px 14px",
              cursor: "pointer",
            }}
          >
            <Plus size={14} />
            Submit Report
          </button>
        )}
      </div>

      {showForm && (
        <AddReportForm project={project} onClose={() => setShowForm(false)} />
      )}

      {projectReports.length === 0 && !showForm ? (
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
          <ClipboardList size={40} strokeWidth={1} opacity={0.4} />
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text-secondary)" }}>
              No site reports yet
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)" }}>
              Submit daily site reports to track construction progress, issues, and material deliveries.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {projectReports.map((report) => (
            <SiteReportCard
              key={report.id}
              report={report}
              reporterName={users.find((u) => u.id === report.reportedById)?.name ?? "Unknown"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
