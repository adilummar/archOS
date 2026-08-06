"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  LayoutGrid,
  List,
  Search,
  Plus,
  ArrowUpDown,
  FolderOpen,
} from "lucide-react";
import { useProjectStore } from "@/lib/store/project.store";
import { useTaskStore, projectCompletion } from "@/lib/store/task.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AvatarGroup } from "@/components/shared/Avatar";
import { NewProjectDrawer } from "@/components/project/NewProjectDrawer";

type SortOption = "name" | "deadline_asc" | "deadline_desc" | "value_asc" | "value_desc" | "progress";

function formatLakhs(value?: number) {
  if (value == null || isNaN(value)) return "₹0.0 L";
  return `₹${(value / 100000).toFixed(1)} L`;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ProjectsPage() {
  const router = useRouter();
  const params = useParams<{ firmSlug: string }>();
  const firmSlug = params?.firmSlug ?? "demo";

  const { projects } = useProjectStore();
  const { tasks } = useTaskStore();
  const { users } = useFirmStore();
  const { firm, user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "on_hold" | "completed">("all");
  const [sortOption, setSortOption] = useState<SortOption>("name");
  const [newProjectOpen, setNewProjectOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const visibleProjects = useMemo(() => {
    if (!firm || !user) return [];

    let filtered = projects.filter((p) => p.firmId === firm.id);

    if (user.role === "staff") {
      filtered = filtered.filter(
        (p) => p.staffIds.includes(user.id) || p.teamLeadId === user.id
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      switch (sortOption) {
        case "name":
          return a.name.localeCompare(b.name);
        case "deadline_asc":
          return new Date(a.expectedEndDate).getTime() - new Date(b.expectedEndDate).getTime();
        case "deadline_desc":
          return new Date(b.expectedEndDate).getTime() - new Date(a.expectedEndDate).getTime();
        case "value_asc":
          return (a.feeAgreed || 0) - (b.feeAgreed || 0);
        case "value_desc":
          return (b.feeAgreed || 0) - (a.feeAgreed || 0);
        case "progress": {
          const progA = projectCompletion(tasks, a.id);
          const progB = projectCompletion(tasks, b.id);
          return progB - progA;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [projects, firm, user, statusFilter, debouncedSearch, sortOption, tasks]);

  const counts = useMemo(() => {
    if (!firm || !user) return { all: 0, active: 0, on_hold: 0, completed: 0 };
    let base = projects.filter((p) => p.firmId === firm.id);
    if (user.role === "staff") {
      base = base.filter((p) => p.staffIds.includes(user.id) || p.teamLeadId === user.id);
    }
    return {
      all: base.length,
      active: base.filter((p) => p.status === "active").length,
      on_hold: base.filter((p) => p.status === "on_hold").length,
      completed: base.filter((p) => p.status === "completed").length,
    };
  }, [projects, firm, user]);

  const getUserNames = (userIds: string[]) => {
    return userIds.map((id) => users.find((u) => u.id === id)?.name || "Unknown");
  };

  if (loading) {
    return (
      <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ width: "200px", height: "32px", background: "var(--color-bg-card)", borderRadius: "var(--radius-md)" }} />
          <div style={{ width: "120px", height: "32px", background: "var(--color-bg-card)", borderRadius: "var(--radius-md)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ height: "220px", background: "var(--color-bg-card)", borderRadius: "var(--radius-md)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px", minHeight: "100%", background: "var(--color-bg-canvas)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>Projects</h1>
          <button
            onClick={() => setNewProjectOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--color-accent)",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background var(--duration-fast)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-accent)"; }}
          >
            <Plus size={16} /> New Project
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "16px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid var(--color-border)", flex: 1 }}>
          {(["all", "active", "on_hold", "completed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: statusFilter === status ? "2px solid var(--color-accent)" : "2px solid transparent",
                color: statusFilter === status ? "var(--color-text-primary)" : "var(--color-text-muted)",
                padding: "8px 0",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "-1px",
              }}
            >
              {status === "all" ? "All" : status === "active" ? "Active" : status === "on_hold" ? "On Hold" : "Completed"}
              <span
                style={{
                  background: statusFilter === status ? "var(--color-accent-muted)" : "var(--color-bg-subtle)",
                  color: statusFilter === status ? "var(--color-accent)" : "var(--color-text-muted)",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  fontSize: "10px",
                }}
              >
                {counts[status]}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
                padding: "8px 12px 8px 36px",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--text-sm)",
                outline: "none",
                width: "240px",
              }}
            />
          </div>

          <div style={{ position: "relative" }}>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              style={{
                background: "var(--color-bg-input)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
                padding: "8px 32px 8px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--text-sm)",
                appearance: "none",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="name">Name</option>
              <option value="deadline_asc">Deadline (Asc)</option>
              <option value="deadline_desc">Deadline (Desc)</option>
              <option value="value_asc">Value (Asc)</option>
              <option value="value_desc">Value (Desc)</option>
              <option value="progress">% Progress</option>
            </select>
            <ArrowUpDown size={14} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
          </div>

          <div style={{ display: "flex", background: "var(--color-bg-input)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", padding: "2px" }}>
            <button
              onClick={() => setView("grid")}
              style={{
                background: view === "grid" ? "var(--color-bg-card-hover)" : "transparent",
                border: "none",
                color: view === "grid" ? "var(--color-text-primary)" : "var(--color-text-muted)",
                padding: "6px",
                borderRadius: "calc(var(--radius-sm) - 2px)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView("list")}
              style={{
                background: view === "list" ? "var(--color-bg-card-hover)" : "transparent",
                border: "none",
                color: view === "list" ? "var(--color-text-primary)" : "var(--color-text-muted)",
                padding: "6px",
                borderRadius: "calc(var(--radius-sm) - 2px)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {visibleProjects.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px", background: "var(--color-bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", gap: "16px" }}>
          <FolderOpen size={48} color="var(--color-text-muted)" opacity={0.5} />
          <div style={{ textAlign: "center" }}>
            <h3 style={{ margin: 0, color: "var(--color-text-primary)", fontSize: "var(--text-lg)" }}>No projects found</h3>
            <p style={{ margin: "8px 0 0", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Try adjusting your search or filters.</p>
          </div>
        </div>
      ) : view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {visibleProjects.map((p) => {
            const progress = projectCompletion(tasks, p.id);
            const projectTasks = tasks.filter((t) => t.projectId === p.id);
            const closedTasks = projectTasks.filter((t) => t.status === "done" || t.status === "approved").length;
            const stage = p.stages.find((s) => s.id === p.currentStageId);
            const daysLeft = differenceInDays(parseISO(p.expectedEndDate), new Date());
            const isPast = daysLeft < 0;

            return (
              <div
                key={p.id}
                onClick={() => router.push(`/${firmSlug}/projects/${p.id}`)}
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "20px",
                  cursor: "pointer",
                  transition: "all var(--duration-base)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "var(--color-border-strong)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ overflow: "hidden" }}>
                    <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.name}
                    </h3>
                    <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.clientName}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-accent)", display: "inline-block" }} />
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontWeight: 500 }}>
                      {stage?.name || "No active stage"}
                    </span>
                  </div>
                  <div style={{ height: "4px", background: "var(--color-bg-input)", borderRadius: "2px", overflow: "hidden", marginBottom: "6px" }}>
                    <div style={{ height: "100%", background: "var(--color-accent)", width: `${progress}%` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Progress</span>
                    <span style={{ fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 500 }}>{closedTasks}/{projectTasks.length} tasks</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--color-border)" }}>
                  <AvatarGroup names={getUserNames(p.staffIds)} max={3} />
                  
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-primary)" }}>
                      {formatLakhs(p.feeAgreed)}
                    </span>
                    <span style={{ fontSize: "10px", color: isPast ? "var(--color-destructive)" : "var(--color-text-muted)", fontWeight: isPast ? 600 : 400 }}>
                      {format(parseISO(p.expectedEndDate), "d MMM yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: "var(--color-bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                <th style={{ padding: "12px 16px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)" }}>Project Name</th>
                <th style={{ padding: "12px 16px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)" }}>Client</th>
                <th style={{ padding: "12px 16px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)" }}>Status</th>
                <th style={{ padding: "12px 16px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)" }}>Stage</th>
                <th style={{ padding: "12px 16px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)" }}>Progress</th>
                <th style={{ padding: "12px 16px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)" }}>Team</th>
                <th style={{ padding: "12px 16px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)" }}>Deadline</th>
                <th style={{ padding: "12px 16px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", textAlign: "right" }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {visibleProjects.map((p) => {
                const progress = projectCompletion(tasks, p.id);
                const stage = p.stages.find((s) => s.id === p.currentStageId);
                const daysLeft = differenceInDays(parseISO(p.expectedEndDate), new Date());
                const isPast = daysLeft < 0;

                return (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/${firmSlug}/projects/${p.id}`)}
                    style={{ borderBottom: "1px solid var(--color-border)", cursor: "pointer", transition: "background var(--duration-fast)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-bg-card-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "16px", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)" }}>{p.name}</td>
                    <td style={{ padding: "16px", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{p.clientName}</td>
                    <td style={{ padding: "16px" }}><StatusBadge status={p.status} size="sm" /></td>
                    <td style={{ padding: "16px", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-accent)", display: "inline-block" }} />
                        {stage?.name || "-"}
                      </div>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "48px", height: "4px", background: "var(--color-bg-input)", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "var(--color-accent)", width: `${progress}%` }} />
                        </div>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{progress}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px" }}><AvatarGroup names={getUserNames(p.staffIds)} max={3} /></td>
                    <td style={{ padding: "16px", fontSize: "var(--text-sm)", color: isPast ? "var(--color-destructive)" : "var(--color-text-secondary)" }}>
                      {format(parseISO(p.expectedEndDate), "d MMM yyyy")}
                    </td>
                    <td style={{ padding: "16px", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", textAlign: "right" }}>
                      {formatLakhs(p.feeAgreed)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>
      <NewProjectDrawer open={newProjectOpen} onClose={() => setNewProjectOpen(false)} />
    </>
  );
}
