"use client";

import React, { useState, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { Drawer } from "../../components/shared/Drawer";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Avatar } from "../../components/shared/Avatar";
import { useTaskStore } from "../../lib/store/task.store";
import { useFirmStore } from "../../lib/store/firm.store";
import { useAuthStore } from "../../lib/store/auth.store";
import { useTasks, useUpdateTask, useDeleteTask, useAssignTaskSequence, useSubmitTaskForReviewSequence, useApproveTaskSequence, useRequestTaskRevisionSequence, useStartTaskSequence, useReviewTask, useOverrideTask, useAddSubtask, useToggleSubtask } from "@/hooks/useTasks";
import { useProjectStore } from "../../lib/store/project.store";
import { toast } from "../../lib/store/toast.store";
import * as TaskActions from "@/app/actions/task.actions";
import { useActivityStore } from "../../lib/store/activity.store";
import { useRequestStore } from "../../lib/store/request.store";
import { format } from "date-fns";
import {
  Plus, X, Calendar, User as UserIcon, Tag, Check,
  AlertTriangle, ChevronDown, UserCheck,
} from "lucide-react";

interface TaskDrawerProps {
  taskId: string | null;
  onClose: () => void;
  readonly?: boolean;
}

function formatRelativeTime(dateString: string) {
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.round(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.round(diffHrs / 24)}d ago`;
}

// ─── Reassign dropdown ──────────────────────────────────────────────────────

function ReassignControl({
  currentAssigneeId,
  teamMembers,
  onReassign,
  disabled,
}: {
  currentAssigneeId?: string;
  teamMembers: { id: string; name: string; avatarColor: string; avatarInitials: string; designation: string }[];
  onReassign: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = teamMembers.find((u) => u.id === currentAssigneeId);

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>
          Assignee
        </span>
        {!disabled && (
          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "transparent",
              border: "none",
              color: "var(--color-accent)",
              fontSize: "11px",
              cursor: "pointer",
              padding: "2px 4px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <UserCheck size={11} strokeWidth={1.5} />
            Reassign
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 6,
          padding: "6px 10px",
          background: "var(--color-bg-input)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          cursor: disabled ? "default" : "pointer",
        }}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <Avatar
          name={current?.name || "Unassigned"}
          color={current?.avatarColor}
          initials={current?.avatarInitials}
          size="sm"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {current?.name || "Unassigned"}
          </p>
          {current?.designation && (
            <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-muted)" }}>
              {current.designation}
            </p>
          )}
        </div>
        {!disabled && <ChevronDown size={13} color="var(--color-text-muted)" strokeWidth={1.5} />}
      </div>

      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 10 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: 4,
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-card)",
              zIndex: 20,
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {teamMembers.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  onReassign(u.id);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "8px 12px",
                  background: u.id === currentAssigneeId ? "var(--color-bg-input)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--color-border)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background var(--duration-fast)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-card-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = u.id === currentAssigneeId ? "var(--color-bg-input)" : "transparent"; }}
              >
                <Avatar name={u.name} color={u.avatarColor} initials={u.avatarInitials} size="sm" />
                <div>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-primary)" }}>{u.name}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-muted)" }}>{u.designation}</p>
                </div>
                {u.id === currentAssigneeId && (
                  <Check size={12} color="var(--color-accent)" style={{ marginLeft: "auto" }} />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── TaskDrawer ─────────────────────────────────────────────────────────────

export function TaskDrawer({ taskId, onClose, readonly }: TaskDrawerProps) {
  const authUser = useAuthStore((s) => s.user);
  const firmId = authUser?.firmId || "";
  const { data: tasks = [] } = useTasks(firmId);
  const task = tasks.find((t) => t.id === taskId);

    const assignTaskMut = useAssignTaskSequence(firmId);
  const startTaskMut = useStartTaskSequence(firmId);
  const submitReviewMut = useSubmitTaskForReviewSequence(firmId);
  const approveTaskMut = useApproveTaskSequence(firmId);
  const requestRevisionMut = useRequestTaskRevisionSequence(firmId);
  const updateTaskMut = useUpdateTask(firmId, authUser?.id || "");
  const deleteTaskMut = useDeleteTask(firmId, authUser?.id || "");
  const reviewTaskMut = useReviewTask(firmId, authUser?.id || "");
  const overrideTaskMut = useOverrideTask(firmId);
  const addSubtaskMut = useAddSubtask(firmId);
  const toggleSubtaskMut = useToggleSubtask(firmId);
  const users = useFirmStore((s) => s.users);
  const projects = useProjectStore((s) => s.projects);
  const activities = useActivityStore((s) => s.logs);

  const [titleEdit, setTitleEdit] = useState(task?.title || "");
  const [descEdit, setDescEdit] = useState(task?.description || "");
  const [newSubtask, setNewSubtask] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [pendingPriority, setPendingPriority] = useState<string | null>(null);
  const [pendingAssigneeId, setPendingAssigneeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const hasPendingChanges = pendingDate !== null || pendingPriority !== null || pendingAssigneeId !== null || titleEdit !== (task?.title || '') || descEdit !== (task?.description || '');

  useEffect(() => {
    if (task) {
      setTitleEdit(task.title);
      setDescEdit(task.description || "");
    }
  }, [task]);

  if (!task) return null;

  const project = projects.find((p) => p.id === task.projectId);
  const stage = project?.stages.find((s) => s.id === task.stageId);
  const assignee = users.find((u) => u.id === task.assigneeId);
  const taskActivities = activities.filter((a) => a.entityId === task.id);

  const isAdminOrLead = authUser?.role === "admin" || authUser?.role === "team_lead";

  // Team members for reassign: all active staff on this project
  const teamMembers = users.filter(
    (u) =>
      u.status === "active" &&
      u.firmId === task.firmId &&
      (project?.staffIds.includes(u.id) || project?.teamLeadId === u.id || u.role === "admin")
  );

  const handleTitleBlur = () => {
    if (titleEdit.trim() === "") {
      setTitleEdit(task.title);
    }
  };

  const handleDescBlur = () => {
    // description saved via Apply button
  };

  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as any;
    // updateTaskLocal(task.id, { status: val });
    updateTaskMut.mutateAsync({ taskId: task.id, data: { status: val } });
    toast("Status updated", "success");
  };

  const handlePriorityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPendingPriority(e.target.value);
  };

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPendingDate(e.target.value);
  };


  const handleAssignActiveTask = async () => {
    const finalAssigneeId = pendingAssigneeId || task.assigneeId || undefined;
    const projectStaffCount = project?.staffIds?.length ?? 0;
    if (projectStaffCount > 1 && !finalAssigneeId) {
      toast("Please select an assignee.", "error");
      return;
    }
    setIsSaving(true);
    try {
      const parsedDate = pendingDate ? new Date(pendingDate) : null;
      await assignTaskMut.mutateAsync({ taskId: task.id, dueDate: parsedDate ? parsedDate.toISOString() : null, assigneeId: finalAssigneeId });
      toast("Task assigned successfully", "success");
      setPendingDate(null);
      setPendingAssigneeId(null);
      onClose();
    } catch (err: any) {
      toast(err.message || "Failed to assign task", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartWork = async () => {
    setIsSaving(true);
    try {
      await updateTaskMut.mutateAsync({ taskId: task.id, data: { status: "in_progress" } });
      toast("Task started", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGiveForReview = async () => {
    setIsSaving(true);
    try {
      await submitReviewMut.mutateAsync({ taskId: task.id });
      toast("Task submitted for review", "success");
      onClose();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    setIsSaving(true);
    try {
      await approveTaskMut.mutateAsync({ taskId: task.id });
      toast("Task approved and completed", "success");
      onClose();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestRevision = async () => {
    const remark = prompt("Enter revision remark:");
    if (!remark) return;
    const dateStr = prompt("Enter new due date (YYYY-MM-DD):", pendingDate || "");
    if (!dateStr) return;
    setIsSaving(true);
    try {
      await requestRevisionMut.mutateAsync({ taskId: task.id, remark, newDueDate: new Date(dateStr).toISOString() });
      toast("Revision requested", "success");
      onClose();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApply = async () => {

    const patch: Record<string, any> = {};
    if (titleEdit.trim() !== "" && titleEdit !== task.title) patch.title = titleEdit;
    if (descEdit !== (task.description || "")) patch.description = descEdit;
    if (pendingDate !== null) patch.dueDate = pendingDate;
    if (pendingPriority !== null) patch.priority = pendingPriority;
    if (pendingAssigneeId !== null) patch.assigneeId = pendingAssigneeId;
    if (Object.keys(patch).length === 0) return;
    setIsSaving(true);
    try {
      // updateTaskLocal(task.id, patch as any);
      await updateTaskMut.mutateAsync({ taskId: task.id, data: patch });
      setPendingDate(null);
      setPendingPriority(null);
      setPendingAssigneeId(null);
      toast("Changes saved", "success");
    } catch {
      toast("Failed to save changes", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      addSubtaskMut.mutateAsync({ taskId: task.id, data: {
        title: newSubtask,
        createdById: authUser?.id || "",
        assignedToId: authUser?.id || "",
      } });
      setNewSubtask("");
      setIsAddingSubtask(false);
    }
  };

  const handleSubtaskKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddSubtask();
    if (e.key === "Escape") {
      setIsAddingSubtask(false);
      setNewSubtask("");
    }
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const newSubtasks = task.subtasks.filter((s) => s.id !== subtaskId);
    updateTaskMut.mutateAsync({ taskId: task.id, data: { subtasks: newSubtasks } });
  };

  const handleReassign = (assigneeId: string) => {
    // Store as pending — saved when Apply Changes is clicked
    setPendingAssigneeId(assigneeId);
  };

  const statusOptions = [
    { value: "todo", label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "review", label: "Review" },
    ...(isAdminOrLead ? [{ value: "approved", label: "Approved" }] : []),
    { value: "done", label: "Done" },
    { value: "blocked", label: "Blocked" },
  ];

  const hasPendingCR = !!task.pendingChangeRequestId;

  return (
    <Drawer open={!!taskId} onClose={onClose} width={480}>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", margin: "-4px" }}>

        {/* Header section */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            <span>{project?.name || "Unknown Project"}</span>
            <span>&gt;</span>
            <span>{stage?.name || "Unknown Stage"}</span>
            <div style={{ marginLeft: "auto" }}>
              <StatusBadge status={task.priority} size="sm" />
            </div>
          </div>
          <input
            type="text"
            value={titleEdit}
            onChange={(e) => setTitleEdit(e.target.value)}
            disabled={readonly}
            style={{
              fontSize: "20px",
              fontWeight: 600,
              width: "100%",
              border: "1px solid transparent",
              background: "transparent",
              color: "var(--color-text-primary)",
              padding: "4px 8px",
              marginLeft: "-8px",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-display)",
              transition: "all 0.2s"
            }}
            onFocus={(e) => { e.currentTarget.style.background = "var(--color-bg-input)"; e.currentTarget.style.border = "1px solid var(--color-border)"; }}
            onBlur={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.border = "1px solid transparent";
              handleTitleBlur();
            }}
          />
        </div>

        {/* Change Request Banner */}
        {hasPendingCR && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "12px 14px",
              background: "var(--color-warning-muted, rgba(245,158,11,0.1))",
              border: "1px solid var(--color-warning)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <AlertTriangle size={16} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 1 }} strokeWidth={1.5} />
            <div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--color-warning)" }}>
                Pending Change Request
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                A change request is associated with this task and awaiting approval.
                Review it in the Change Requests tab.
              </p>
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ borderTop: "1px solid var(--color-border)" }} />

        {/* Status Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>
            Status
          </span>
          <div style={{ padding: "6px 12px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
            <StatusBadge status={task.status as any} size="sm" />
          </div>
        </div>

        {task.startDate && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: -8 }}>
            <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>
              Started
            </span>
            <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-primary)" }}>
              {format(new Date(task.startDate), "dd MMM yyyy, p")}
            </div>
          </div>
        )}

        {/* Meta Row — Assignee + Due Date + Priority */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Assignee with Reassign */}
          <ReassignControl
            currentAssigneeId={pendingAssigneeId ?? task.assigneeId}
            teamMembers={teamMembers}
            onReassign={handleReassign}
            disabled={readonly || !isAdminOrLead}
          />

          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>
                Due Date
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--color-bg-input)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "4px 8px" }}>
                <Calendar size={14} color="var(--color-text-muted)" strokeWidth={1.5} />
                <input
                  type="date"
                  value={pendingDate !== null ? pendingDate : (task.dueDate ? task.dueDate.split('T')[0] : '')}
                  onChange={handleDateChange}
                  disabled={readonly}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "13px",
                    color: "var(--color-text-primary)",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>
                Priority
              </span>
              <select
                value={pendingPriority !== null ? pendingPriority : task.priority}
                onChange={handlePriorityChange}
                disabled={readonly || !isAdminOrLead}
                style={{
                  background: "var(--color-bg-input)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 8px",
                  fontSize: "13px",
                  color: "var(--color-text-primary)",
                  outline: "none"
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Apply Changes Button — active tasks can be assigned with no due date and no other edits */}
        {!readonly && (hasPendingChanges || (isAdminOrLead && task.status === "active")) && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            {task.status === "active" ? (
              <button
                onClick={handleAssignActiveTask}
                disabled={isSaving}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 18px",
                  background: "var(--color-accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: isSaving ? "not-allowed" : "pointer",
                  opacity: isSaving ? 0.7 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {isSaving ? "Assigning..." : "Assign Task"}
              </button>
            ) : (
              <button
                onClick={handleApply}
                disabled={isSaving}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 18px",
                  background: "var(--color-accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: isSaving ? "not-allowed" : "pointer",
                  opacity: isSaving ? 0.7 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {isSaving ? "Saving..." : "Apply Changes"}
              </button>
            )}
          </div>
        )}

        <div style={{ borderTop: "1px solid var(--color-border)" }} />

        {/* Description */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>
            Description
          </span>
          <textarea
            value={descEdit}
            onChange={(e) => setDescEdit(e.target.value)}
            onBlur={handleDescBlur}
            disabled={readonly}
            placeholder="Add task description…"
            rows={4}
            style={{
              width: "100%",
              background: "var(--color-bg-input)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "12px",
              fontSize: "14px",
              lineHeight: 1.5,
              color: "var(--color-text-primary)",
              resize: "vertical",
              outline: "none",
              fontFamily: "var(--font-body)"
            }}
          />
        </div>

        <div style={{ borderTop: "1px solid var(--color-border)" }} />

        {/* Subtasks */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>
              Subtasks
              {task.subtasks.length > 0 && (
                <span style={{ marginLeft: 6, color: "var(--color-text-muted)", fontWeight: 400 }}>
                  ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
                </span>
              )}
            </span>
            {!readonly && (
              <button
                onClick={() => setIsAddingSubtask(true)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {task.subtasks.map((st) => (
            <div
              key={st.id}
              className="group"
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "4px 0", position: "relative" }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget.querySelector('button');
                if (btn) btn.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget.querySelector('button');
                if (btn) btn.style.opacity = '0';
              }}
            >
              <input
                type="checkbox"
                checked={st.completed}
                onChange={() => toggleSubtaskMut.mutateAsync({ subtaskId: st.id, data: {} })}
                disabled={readonly}
                style={{ accentColor: "var(--color-accent)" }}
              />
              <span style={{ fontSize: "14px", textDecoration: st.completed ? "line-through" : "none", color: st.completed ? "var(--color-text-muted)" : "inherit", flex: 1 }}>
                {st.title}
              </span>
              {!readonly && (
                <button
                  onClick={() => handleDeleteSubtask(st.id)}
                  style={{
                    marginLeft: "auto",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-muted)",
                    opacity: 0,
                    transition: "opacity 0.2s"
                  }}
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              )}
            </div>
          ))}

          {isAddingSubtask && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "4px 0" }}>
              <input type="checkbox" disabled />
              <input
                autoFocus
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                onBlur={() => { setIsAddingSubtask(false); setNewSubtask(""); }}
                placeholder="New subtask..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--color-border)",
                  fontSize: "14px",
                  color: "var(--color-text-primary)",
                  outline: "none",
                  padding: "2px 0"
                }}
              />
            </div>
          )}
        </div>

        {/* Blocked reason */}
        {task.isBlocked && task.blockedReason && (
          <>
            <div style={{ borderTop: "1px solid var(--color-border)" }} />
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 12px",
                background: "var(--color-destructive-muted, rgba(239,68,68,0.08))",
                border: "1px solid var(--color-destructive)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <AlertTriangle size={14} color="var(--color-destructive)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "var(--color-destructive)" }}>Blocked</p>
                <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  {task.blockedReason}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Staff Actions */}
        {!isAdminOrLead && readonly && (
          <>
            <div style={{ borderTop: "1px solid var(--color-border)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--color-bg-input)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
              {['assigned', 'revision_requested'].includes(task.status) && (
                <button
                  onClick={async () => {
                    try {
                      await startTaskMut.mutateAsync({ taskId: task.id });
                                            toast("Task started", "success");
                      // Do NOT close drawer so they can see "In Progress" and "Give for Review"
                    } catch (e: any) {
                      toast(e.message || "Failed to start task", "error");
                    }
                  }}
                  style={{ width: "100%", background: "var(--color-accent)", color: "white", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
                >
                  Start Task
                </button>
              )}
              {task.status === "in_progress" && (
                <button
                  onClick={async () => {
                    try {
                      const updated = await submitReviewMut.mutateAsync({ taskId: task.id });
                                            toast("Task submitted for review", "success");
                      // Do NOT close drawer so they see it's submitted
                    } catch (e: any) {
                      toast(e.message || "Failed to submit task", "error");
                    }
                  }}
                  style={{ width: "100%", background: "var(--color-success)", color: "white", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
                >
                  Give for Review
                </button>
              )}
            </div>
          </>
        )}

        {/* Approval section */}
        {isAdminOrLead && ['review', 'submitted_for_review'].includes(task.status) && (
          <>
            <div style={{ borderTop: "1px solid var(--color-border)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--color-bg-input)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: "12px", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
                <Check size={14} strokeWidth={1.5} color="var(--color-success)" />
                Task requires approval
              </span>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={async () => {
                    try {
                      await approveTaskMut.mutateAsync({ taskId: task.id });
                      toast("Task approved", "success");
                      onClose();
                    } catch (e: any) {
                      toast(e.message || "Failed to approve task", "error");
                    }
                  }}
                  style={{ flex: 1, background: "var(--color-success)", color: "white", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
                >
                  Approve
                </button>
                <button
                  onClick={async () => {
                    try {
                      await requestRevisionMut.mutateAsync({ taskId: task.id, remark: "Revision required", newDueDate: new Date().toISOString() });
                      toast("Revision requested", "success");
                      onClose();
                    } catch (e: any) {
                      toast(e.message || "Failed to request revision", "error");
                    }
                  }}
                  style={{ flex: 1, background: "var(--color-warning)", color: "white", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
                >
                  Request Revision
                </button>
              </div>
            </div>
          </>
        )}

        <div style={{ borderTop: "1px solid var(--color-border)" }} />

        {/* Activity log */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>
            Activity
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {taskActivities.length === 0 ? (
              <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No recent activity</div>
            ) : (
              taskActivities.map((act) => (
                <div key={act.id} style={{ display: "flex", gap: "12px" }}>
                  <Avatar name={act.userName} size="sm" />
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ fontSize: "13px" }}>
                      <span style={{ fontWeight: 500 }}>{act.userName}</span> {act.description}
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                      {formatRelativeTime(act.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </Drawer>
  );
}




