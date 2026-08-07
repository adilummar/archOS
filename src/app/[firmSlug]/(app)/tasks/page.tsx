"use client";
/**
 * Tasks Page — firm-wide task list with list and kanban views.
 * Phase 5.1: list with filters (status, priority, project, assignee).
 * Phase 5.2: kanban view with @dnd-kit.
 * Overdue rows: red date, red left border.
 * Click row/card → TaskDrawer.
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO, isPast, isToday } from "date-fns";
import {
  CheckSquare,
  Search,
  LayoutGrid,
  List,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTaskStore, projectCompletion } from "@/lib/store/task.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar } from "@/components/shared/Avatar";
import { TaskDrawer } from "@/components/drawers/TaskDrawer";
import { toast } from "@/lib/store/toast.store";
import type { Task, TaskStatus, Priority } from "@/lib/store/types";

const PRIORITY_DOT: Record<Priority, string> = {
  low: "var(--color-text-muted)",
  medium: "var(--color-warning)",
  high: "var(--color-accent)",
  urgent: "var(--color-destructive)",
};

const STATUS_OPTIONS: { value: "all" | TaskStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "approved", label: "Approved" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

const KANBAN_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "To Do", color: "var(--color-text-muted)" },
  { id: "in_progress", label: "In Progress", color: "var(--color-info, #3b82f6)" },
  { id: "review", label: "Review", color: "var(--color-warning)" },
  { id: "approved", label: "Approved", color: "var(--color-success)" },
  { id: "done", label: "Done", color: "var(--color-success)" },
  { id: "blocked", label: "Blocked", color: "var(--color-destructive)" },
];

// ─── Sortable Kanban Card ─────────────────────────────────────────────────────

function SortableKanbanCard({
  task,
  assignee,
  project,
  onClick,
}: {
  task: Task;
  assignee?: { name: string; avatarColor: string; avatarInitials: string };
  project?: { name: string };
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "done" &&
    task.status !== "approved";

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      onClick={onClick}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        background: isDragging ? "var(--color-bg-card-hover)" : "var(--color-bg-card)",
        border: `1px solid ${isOverdue ? "var(--color-destructive)" : isDragging ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-sm)",
        padding: "10px 12px",
        cursor: "pointer",
        opacity: isDragging ? 0.85 : 1,
        boxShadow: isDragging ? "var(--shadow-card)" : "none",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Drag handle + priority bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          {...listeners}
          title="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            alignItems: "center",
            color: "var(--color-text-muted)",
            cursor: "grab",
            touchAction: "none",
            flexShrink: 0,
          }}
        >
          <GripVertical size={13} strokeWidth={1.5} />
        </div>
        <div
          style={{
            flex: 1,
            height: 2,
            background: PRIORITY_DOT[task.priority] ?? "transparent",
            borderRadius: 1,
            opacity: 0.7,
          }}
        />
      </div>

      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-primary)", lineHeight: 1.4 }}>
        {task.title}
      </p>

      {project && (
        <span style={{
          fontSize: 10,
          color: "var(--color-text-muted)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {project.name}
        </span>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {assignee ? (
          <Avatar name={assignee.name} color={assignee.avatarColor} initials={assignee.avatarInitials} size="sm" />
        ) : <span />}
        {task.dueDate && (
          <span style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            color: isOverdue ? "var(--color-destructive)" : "var(--color-text-muted)",
          }}>
            {format(parseISO(task.dueDate), "d MMM")}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  tasks,
  users,
  projects,
  onTaskClick,
}: {
  col: typeof KANBAN_COLUMNS[0];
  tasks: Task[];
  users: import("@/lib/store/types").User[];
  projects: import("@/lib/store/types").Project[];
  onTaskClick: (id: string) => void;
}) {
  return (
    <div style={{ width: 230, flexShrink: 0, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderBottom: `2px solid ${col.color}`, marginBottom: 8 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: col.color }}>{col.label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", background: "var(--color-bg-input)", padding: "0 6px", borderRadius: 10 }}>
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 40 }}>
          {tasks.map((task) => {
            const assignee = users.find((u) => u.id === task.assigneeId);
            const project = projects.find((p) => p.id === task.projectId);
            return (
              <SortableKanbanCard
                key={task.id}
                task={task}
                assignee={assignee ? { name: assignee.name, avatarColor: assignee.avatarColor, avatarInitials: assignee.avatarInitials } : undefined}
                project={project ? { name: project.name } : undefined}
                onClick={() => onTaskClick(task.id)}
              />
            );
          })}
          {tasks.length === 0 && (
            <div style={{
              padding: "16px",
              textAlign: "center",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              border: "1px dashed var(--color-border)",
              borderRadius: "var(--radius-sm)",
            }}>
              No tasks
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Tasks Page ───────────────────────────────────────────────────────────────

export default function TasksPage() {
  const params = useParams<{ firmSlug: string }>();
  const router = useRouter();
  const { tasks, setTaskStatus } = useTaskStore();
  const { projects } = useProjectStore();
  const { user, firm } = useAuthStore();
  const { users } = useFirmStore();

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // DnD sensors for kanban
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const firmProjects = useMemo(
    () => projects.filter((p) => p.firmId === firm?.id),
    [projects, firm]
  );

  const filteredTasks = useMemo(() => {
    if (!firm || !user) return [];
    let result = tasks.filter((t) => t.firmId === firm.id);

    if (user.role === "staff") {
      result = result.filter((t) => t.assigneeId === user.id);
    }

    if (showMyTasksOnly) {
      result = result.filter((t) => t.assigneeId === user.id);
    }

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    if (projectFilter !== "all") {
      result = result.filter((t) => t.projectId === projectFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }

    // Sort: overdue first, then by due date
    return result.sort((a, b) => {
      const aOverdue = isPast(parseISO(a.dueDate)) && a.status !== "done" && a.status !== "approved";
      const bOverdue = isPast(parseISO(b.dueDate)) && b.status !== "done" && b.status !== "approved";
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [tasks, firm, user, statusFilter, priorityFilter, projectFilter, search, showMyTasksOnly]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Check if over is a column id
    const targetColumn = KANBAN_COLUMNS.find((c) => c.id === over.id);
    const sourceTask = filteredTasks.find((t) => t.id === active.id);
    if (!sourceTask) return;

    if (targetColumn && sourceTask.status !== targetColumn.id) {
      setTaskStatus(sourceTask.id, targetColumn.id);
      toast(`Moved to ${targetColumn.label}`, "success");
    } else {
      // Dropped on another card — find which column it's in
      const overTask = filteredTasks.find((t) => t.id === over.id);
      if (overTask && sourceTask.status !== overTask.status) {
        setTaskStatus(sourceTask.id, overTask.status);
        const col = KANBAN_COLUMNS.find((c) => c.id === overTask.status);
        toast(`Moved to ${col?.label ?? overTask.status}`, "success");
      }
    }
  };

  const getProject = (projectId: string) => firmProjects.find((p) => p.id === projectId);
  const getAssignee = (assigneeId: string) => users.find((u) => u.id === assigneeId);

  const selectStyle: React.CSSProperties = {
    background: "var(--color-bg-input)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--color-text-primary)",
    fontSize: "var(--text-sm)",
    padding: "7px 12px",
    outline: "none",
    cursor: "pointer",
  };

  if (loading) {
    return (
      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ width: 200, height: 32, background: "var(--color-bg-card)", borderRadius: "var(--radius-md)" }} />
        <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ height: 52, borderBottom: "1px solid var(--color-border)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
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
          <h1 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-text-primary)" }}>
            Tasks
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "4px 10px",
            }}>
              {filteredTasks.length} tasks
            </span>
            {/* View toggle */}
            <div style={{ display: "flex", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: 2 }}>
              {([
                { id: "list" as const, Icon: List },
                { id: "kanban" as const, Icon: LayoutGrid },
              ]).map(({ id, Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 10px",
                    background: view === id ? "var(--color-bg-card-hover)" : "transparent",
                    border: "none",
                    color: view === id ? "var(--color-text-primary)" : "var(--color-text-muted)",
                    fontSize: "var(--text-sm)",
                    cursor: "pointer",
                    borderRadius: "calc(var(--radius-sm) - 2px)",
                    transition: "all var(--duration-fast)",
                  }}
                >
                  <Icon size={13} strokeWidth={1.5} />
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters bar */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input
              type="text"
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...selectStyle, paddingLeft: 32, width: 200 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          </div>

          {/* Status (hidden in kanban — we show all cols) */}
          {view === "list" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              style={selectStyle}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
            style={selectStyle}
          >
            <option value="all">All Priority</option>
            {(["urgent", "high", "medium", "low"] as Priority[]).map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>

          {/* Project */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            style={{ ...selectStyle, maxWidth: 200 }}
          >
            <option value="all">All Projects</option>
            {firmProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* My tasks toggle */}
          {user?.role !== "staff" && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "var(--text-sm)",
                color: showMyTasksOnly ? "var(--color-accent)" : "var(--color-text-muted)",
                cursor: "pointer",
                padding: "7px 12px",
                background: showMyTasksOnly ? "var(--color-accent-muted)" : "var(--color-bg-input)",
                border: `1px solid ${showMyTasksOnly ? "var(--color-accent)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-sm)",
                fontWeight: showMyTasksOnly ? 500 : 400,
              }}
            >
              <input
                type="checkbox"
                checked={showMyTasksOnly}
                onChange={(e) => setShowMyTasksOnly(e.target.checked)}
                style={{ display: "none" }}
              />
              My tasks only
            </label>
          )}
        </div>

        {/* ─── LIST VIEW ───────────────────────────────────────────────────── */}
        {view === "list" && (
          filteredTasks.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "64px 0", gap: 12, background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text-muted)",
            }}>
              <CheckSquare size={40} strokeWidth={1} opacity={0.4} />
              <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text-secondary)" }}>No tasks match your filters</p>
              <p style={{ margin: 0, fontSize: "var(--text-xs)" }}>Clear your filters or check a different project.</p>
            </div>
          ) : (
            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)" }}>
                    <th style={{ padding: "10px 16px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)", width: 24 }} />
                    <th style={{ padding: "10px 16px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)" }}>Task</th>
                    <th style={{ padding: "10px 16px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)" }}>Project</th>
                    <th style={{ padding: "10px 16px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)" }}>Assignee</th>
                    <th style={{ padding: "10px 16px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)" }}>Due Date</th>
                    <th style={{ padding: "10px 16px", fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-muted)" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => {
                    const project = getProject(task.projectId);
                    const assignee = getAssignee(task.assigneeId);
                    const overdue =
                      isPast(parseISO(task.dueDate)) &&
                      task.status !== "done" &&
                      task.status !== "approved";
                    const dueToday = isToday(parseISO(task.dueDate));

                    return (
                      <tr
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        style={{
                          borderBottom: "1px solid var(--color-border)",
                          borderLeft: overdue ? "3px solid var(--color-destructive)" : "3px solid transparent",
                          cursor: "pointer",
                          transition: "background var(--duration-fast)",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-card-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* Priority dot */}
                        <td style={{ padding: "12px 16px", width: 24 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_DOT[task.priority], display: "inline-block" }} />
                        </td>

                        {/* Task title */}
                        <td style={{ padding: "12px 16px" }}>
                          <div>
                            <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)" }}>
                              {task.title}
                            </p>
                            {task.isBlocked && (
                              <span style={{ fontSize: 10, color: "var(--color-destructive)", fontWeight: 500 }}>
                                Blocked{task.blockedReason ? `: ${task.blockedReason}` : ""}
                              </span>
                            )}
                            {task.subtasks.length > 0 && (
                              <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>
                                {" "}· {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Project */}
                        <td style={{ padding: "12px 16px" }}>
                          {project ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/${params.firmSlug}/projects/${project.id}`);
                              }}
                              style={{
                                background: "var(--color-bg-input)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-sm)",
                                color: "var(--color-text-secondary)",
                                fontSize: "var(--text-xs)",
                                padding: "3px 8px",
                                cursor: "pointer",
                                maxWidth: 160,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-accent)")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
                            >
                              {project.name}
                            </button>
                          ) : (
                            <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>—</span>
                          )}
                        </td>

                        {/* Assignee */}
                        <td style={{ padding: "12px 16px" }}>
                          {assignee ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Avatar name={assignee.name} size="sm" color={assignee.avatarColor} />
                              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                                {assignee.name}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>Unassigned</span>
                          )}
                        </td>

                        {/* Due date */}
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            fontSize: "var(--text-sm)",
                            color: overdue ? "var(--color-destructive)" : dueToday ? "var(--color-warning)" : "var(--color-text-muted)",
                            fontWeight: overdue || dueToday ? 600 : 400,
                          }}>
                            {format(parseISO(task.dueDate), "d MMM yyyy")}
                            {overdue && " · Overdue"}
                            {dueToday && !overdue && " · Today"}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "12px 16px" }}>
                          <StatusBadge status={task.status} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ─── KANBAN VIEW ─────────────────────────────────────────────────── */}
        {view === "kanban" && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16 }}>
              {KANBAN_COLUMNS.map((col) => {
                const colTasks = filteredTasks.filter((t) => t.status === col.id);
                return (
                  <KanbanColumn
                    key={col.id}
                    col={col}
                    tasks={colTasks}
                    users={users}
                    projects={firmProjects}
                    onTaskClick={setSelectedTaskId}
                  />
                );
              })}
            </div>
          </DndContext>
        )}
      </div>

      {/* TaskDrawer */}
      {selectedTaskId && (
        <TaskDrawer
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </>
  );
}
