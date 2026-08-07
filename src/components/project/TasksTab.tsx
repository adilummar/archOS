"use client";
/**
 * TasksTab — project tasks with list and kanban views.
 * Filters: stage, assignee, priority, status.
 * Task 4.5 + 4.6.
 */

import { useState, useMemo } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import {
  LayoutGrid, List, Plus, ChevronDown, Filter,
  Circle, CircleDot, Clock, CheckCircle2, XCircle,
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
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTaskStore } from "../../lib/store/task.store";
import { useFirmStore } from "../../lib/store/firm.store";
import { useAuthStore } from "../../lib/store/auth.store";
import { StatusBadge } from "../shared/StatusBadge";
import { Avatar } from "../shared/Avatar";
import { TaskDrawer } from "../drawers/TaskDrawer";
import type { Project, Task } from "../../lib/store/types";

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "var(--color-destructive)",
  high: "var(--color-accent)",
  medium: "var(--color-warning)",
  low: "var(--color-text-muted)",
};

// ─── Single task row ──────────────────────────────────────────────────────────

function TaskRow({
  task,
  assigneeName,
  assigneeColor,
  assigneeInitials,
  onClick,
}: {
  task: Task;
  assigneeName?: string;
  assigneeColor?: string;
  assigneeInitials?: string;
  onClick: () => void;
}) {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "done" &&
    task.status !== "approved";

  const daysOverdue = isOverdue
    ? Math.abs(differenceInDays(parseISO(task.dueDate), new Date()))
    : 0;

  return (
    <div
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "8px 1fr auto auto auto auto",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderLeft: isOverdue
          ? "2px solid var(--color-destructive)"
          : "2px solid transparent",
        borderBottom: "1px solid var(--color-border)",
        background: "transparent",
        cursor: "pointer",
        transition: "background var(--duration-fast)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "var(--color-bg-card-hover)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      {/* Priority dot */}
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: PRIORITY_COLOR[task.priority] ?? "var(--color-text-muted)",
          flexShrink: 0,
        }}
      />

      {/* Title + subtask progress */}
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-primary)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {task.title}
        </p>
        {task.subtasks && task.subtasks.length > 0 && (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "1px 0 0" }}>
            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
          </p>
        )}
      </div>

      {/* Due date */}
      <span
        style={{
          fontSize: "var(--text-xs)",
          fontFamily: "var(--font-mono)",
          color: isOverdue ? "var(--color-destructive)" : "var(--color-text-muted)",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {isOverdue
          ? `${daysOverdue}d overdue`
          : task.dueDate
          ? format(parseISO(task.dueDate), "d MMM")
          : "—"}
      </span>

      {/* Assignee */}
      {assigneeName ? (
        <Avatar
          name={assigneeName}
          color={assigneeColor}
          initials={assigneeInitials}
          size="sm"
          tooltip
        />
      ) : (
        <div style={{ width: 24 }} />
      )}

      {/* Status */}
      <StatusBadge status={task.status} size="sm" />
    </div>
  );
}

// ─── Kanban column ────────────────────────────────────────────────────────────

const KANBAN_COLUMNS = [
  { id: "todo",        label: "To Do",       color: "var(--color-text-muted)" },
  { id: "in_progress", label: "In Progress", color: "var(--color-info)" },
  { id: "review",      label: "Review",      color: "var(--color-warning)" },
  { id: "approved",    label: "Approved",    color: "var(--color-success)" },
  { id: "done",        label: "Done",        color: "var(--color-success)" },
  { id: "blocked",     label: "Blocked",     color: "var(--color-destructive)" },
] as const;

function SortableTaskCard({
  task,
  assignee,
  onClick,
}: {
  task: Task;
  assignee?: { name: string; avatarColor: string; avatarInitials: string };
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
        border: `1px solid ${
          isOverdue ? "var(--color-destructive)" : isDragging ? "var(--color-accent)" : "var(--color-border)"
        }`,
        borderRadius: "var(--radius-sm)",
        padding: "10px 12px",
        cursor: "pointer",
        opacity: isDragging ? 0.85 : 1,
        boxShadow: isDragging ? "var(--shadow-card)" : "none",
        zIndex: isDragging ? 10 : undefined,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = isOverdue ? "var(--color-destructive)" : "var(--color-border-strong)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = isOverdue ? "var(--color-destructive)" : "var(--color-border)";
        }
      }}
    >
      {/* Drag handle + priority bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          {...listeners}
          title="Drag to reorder"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 16,
            height: 16,
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
            background: PRIORITY_COLOR[task.priority] ?? "transparent",
            borderRadius: 1,
            opacity: 0.7,
          }}
        />
      </div>

      <p
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--color-text-primary)",
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {task.title}
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {assignee ? (
          <Avatar
            name={assignee.name}
            color={assignee.avatarColor}
            initials={assignee.avatarInitials}
            size="sm"
          />
        ) : (
          <span />
        )}
        {task.dueDate && (
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              color: isOverdue ? "var(--color-destructive)" : "var(--color-text-muted)",
            }}
          >
            {format(parseISO(task.dueDate), "d MMM")}
          </span>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({
  columnId,
  label,
  color,
  tasks,
  users,
  onTaskClick,
}: {
  columnId: string;
  label: string;
  color: string;
  tasks: Task[];
  users: import("@/lib/store/types").User[];
  onTaskClick: (id: string) => void;
}) {
  return (
    <div
      style={{
        width: 230,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* Column header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 10px",
          borderBottom: `2px solid ${color}`,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color }}>
          {label}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--color-text-muted)",
            background: "var(--color-bg-input)",
            padding: "0 6px",
            borderRadius: 10,
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Task cards (sortable) */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 32 }}>
          {tasks.map((task) => {
            const assignee = users.find((u) => u.id === task.assigneeId);
            return (
              <SortableTaskCard
                key={task.id}
                task={task}
                assignee={
                  assignee
                    ? {
                        name: assignee.name,
                        avatarColor: assignee.avatarColor,
                        avatarInitials: assignee.avatarInitials,
                      }
                    : undefined
                }
                onClick={() => onTaskClick(task.id)}
              />
            );
          })}

          {tasks.length === 0 && (
            <div
              style={{
                padding: "16px",
                textAlign: "center",
                fontSize: "var(--text-xs)",
                color: "var(--color-text-muted)",
                border: "1px dashed var(--color-border)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              No tasks
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── TasksTab ─────────────────────────────────────────────────────────────────

interface Props {
  project: Project;
}

export function TasksTab({ project }: Props) {
  const { tasks, setTaskStatus } = useTaskStore();
  const { users } = useFirmStore();
  const { user } = useAuthStore();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const targetColumnId = over.id;
    const sourceTask = filteredTasks.find((t) => t.id === active.id);
    if (!sourceTask) return;

    if (sourceTask.status !== targetColumnId) {
      setTaskStatus(sourceTask.id, targetColumnId as any);
    }
  };

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === project.id),
    [tasks, project.id]
  );

  const filteredTasks = useMemo(() => {
    return projectTasks.filter((t) => {
      if (stageFilter !== "all" && t.stageId !== stageFilter) return false;
      if (assigneeFilter !== "all" && t.assigneeId !== assigneeFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [projectTasks, stageFilter, assigneeFilter, priorityFilter]);

  const teamMembers = users.filter(
    (u) => project.staffIds.includes(u.id) || u.id === project.teamLeadId
  );

  const isLead = user?.role === "admin" || user?.role === "team_lead";

  return (
    <>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {/* View toggle */}
        <div
          style={{
            display: "flex",
            background: "var(--color-bg-input)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
          }}
        >
          {(["list", "kanban"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 10px",
                background: view === v ? "var(--color-bg-card-hover)" : "transparent",
                border: "none",
                color: view === v ? "var(--color-text-primary)" : "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
                cursor: "pointer",
                transition: "all var(--duration-fast)",
              }}
            >
              {v === "list" ? <List size={13} strokeWidth={1.5} /> : <LayoutGrid size={13} strokeWidth={1.5} />}
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Stage filter */}
        <Select
          value={stageFilter}
          onChange={setStageFilter}
          options={[
            { value: "all", label: "All Stages" },
            ...project.stages.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />

        {/* Assignee filter */}
        <Select
          value={assigneeFilter}
          onChange={setAssigneeFilter}
          options={[
            { value: "all", label: "All Assignees" },
            ...teamMembers.map((u) => ({ value: u.id, label: u.name })),
          ]}
        />

        {/* Priority filter */}
        <Select
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={[
            { value: "all", label: "All Priorities" },
            { value: "urgent", label: "Urgent" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ]}
        />

        <div style={{ flex: 1 }} />

        {/* Total */}
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          {filteredTasks.length} tasks
        </span>
      </div>

      {/* List view */}
      {view === "list" && (
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "8px 1fr auto auto auto auto",
              gap: 12,
              padding: "8px 14px",
              borderBottom: "1px solid var(--color-border)",
              background: "var(--color-bg-input)",
            }}
          >
            <span />
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Task
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Due
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Assignee
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Status
            </span>
            <span />
          </div>

          {filteredTasks.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
              No tasks match the current filters.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const assignee = users.find((u) => u.id === task.assigneeId);
              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  assigneeName={assignee?.name}
                  assigneeColor={assignee?.avatarColor}
                  assigneeInitials={assignee?.avatarInitials}
                  onClick={() => setSelectedTaskId(task.id)}
                />
              );
            })
          )}
        </div>
      )}

      {/* Kanban view */}
      {view === "kanban" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              overflowX: "auto",
              paddingBottom: 16,
            }}
          >
            {KANBAN_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                columnId={col.id}
                label={col.label}
                color={col.color}
                tasks={filteredTasks.filter((t) => t.status === col.id)}
                users={users}
                onTaskClick={setSelectedTaskId}
              />
            ))}
          </div>
        </DndContext>
      )}

      {/* Task drawer */}
      <TaskDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </>
  );
}

// ─── Minimal select ───────────────────────────────────────────────────────────

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "6px 10px",
        borderRadius: "var(--radius-sm)",
        background: "var(--color-bg-input)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text-secondary)",
        fontSize: "var(--text-sm)",
        cursor: "pointer",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
