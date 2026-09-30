"use client";

import { useMemo, useState } from "react";
import { format, isPast, parseISO } from "date-fns";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Task, Project, User } from "@/lib/store/types";

export default function StaffTasksView({
  tasks,
  projects,
  users,
  onTaskClick,
}: {
  tasks: Task[];
  projects: Project[];
  users: User[];
  onTaskClick: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"all" | "todo" | "in_progress" | "review" | "completed">("all");
  const [search, setSearch] = useState("");

  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          projects.find((p) => p.id === t.projectId)?.name.toLowerCase().includes(q)
      );
    }

    // Tabs
    if (activeTab === "todo") {
      result = result.filter((t) => ["assigned", "revision_requested"].includes(t.status));
    } else if (activeTab === "in_progress") {
      result = result.filter((t) => t.status === "in_progress");
    } else if (activeTab === "review") {
      result = result.filter((t) => t.status === "submitted_for_review");
    } else if (activeTab === "completed") {
      result = result.filter((t) => ["completed", "approved", "done"].includes(t.status));
    }

    // Sort by due date
    result.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return result;
  }, [tasks, projects, activeTab, search]);

  const PRIORITY_DOT = {
    low: "var(--color-success)",
    normal: "var(--color-warning)",
    high: "var(--color-destructive)",
  } as any;

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24, background: "var(--color-bg-canvas)", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-text-primary)" }}>
          My Tasks
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search my tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            width: 250,
            fontSize: "var(--text-sm)",
            background: "var(--color-bg-input)",
            color: "var(--color-text-primary)",
          }}
        />

        {/* Tabs */}
        <div style={{ display: "flex", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 4 }}>
          {[
            { id: "all", label: "All" },
            { id: "todo", label: "To Do" },
            { id: "in_progress", label: "In Progress" },
            { id: "review", label: "Review" },
            { id: "completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "6px 16px",
                border: "none",
                background: activeTab === tab.id ? "var(--color-bg-canvas)" : "transparent",
                color: activeTab === tab.id ? "var(--color-text-primary)" : "var(--color-text-muted)",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--text-sm)",
                fontWeight: activeTab === tab.id ? 500 : 400,
                cursor: "pointer",
                boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all var(--duration-fast)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        {filteredTasks.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            No tasks found in this view.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
            <thead style={{ background: "var(--color-bg-canvas)", borderBottom: "1px solid var(--color-border)" }}>
              <tr>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--color-text-muted)", width: 40 }}></th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--color-text-muted)" }}>Task</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--color-text-muted)" }}>Project</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--color-text-muted)" }}>Due Date</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--color-text-muted)" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500, color: "var(--color-text-muted)" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                const stage = project?.stages.find((s) => s.id === task.stageId);
                const overdue = task.dueDate && (task.dueDate ? (task.dueDate ? (task.dueDate ? isPast(parseISO(task.dueDate)) : false) : false) : false) && !["completed", "done", "approved"].includes(task.status);
                
                return (
                  <tr
                    key={task.id}
                    onClick={() => onTaskClick(task.id)}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      borderLeft: overdue ? "3px solid var(--color-destructive)" : "3px solid transparent",
                      cursor: "pointer",
                      transition: "background var(--duration-fast)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-card-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_DOT[task.priority || "normal"], display: "inline-block" }} />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{task.title}</div>
                      <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: 2 }}>{stage?.name || "No Stage"}</div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--color-text-primary)" }}>
                      {project?.name || "Unknown"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {task.dueDate ? (
                        <span style={{ color: overdue ? "var(--color-destructive)" : "var(--color-text-primary)", fontWeight: overdue ? 500 : 400 }}>
                          {task.dueDate ? (task.dueDate ? (task.dueDate ? format(parseISO(task.dueDate), "dd MMM yyyy") : "") : "") : ""}
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)" }}>No date</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge status={task.status as any} size="sm" />
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onTaskClick(task.id); }}
                        style={{
                          padding: "6px 12px",
                          background: "var(--color-bg-input)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--color-text-primary)",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        Open Task
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}







