import type { Task, Project } from "@/lib/store/types";

export async function fetchTasks(firmId: string): Promise<Task[]> {
  const res = await fetch("/api/v1/tasks?firmId=" + firmId);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function fetchProjects(firmId: string): Promise<Project[]> {
  const res = await fetch("/api/v1/projects?firmId=" + firmId);
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export async function createTask(firmId: string, data: any) {
  const res = await fetch("/api/v1/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function updateTask(taskId: string, firmId: string, actorId: string, data: any) {
  const res = await fetch("/api/v1/tasks/" + taskId + "?firmId=" + firmId + "&actorId=" + actorId, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

export async function deleteTask(taskId: string, firmId: string, actorId: string) {
  const res = await fetch("/api/v1/tasks/" + taskId + "?firmId=" + firmId + "&actorId=" + actorId, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete task");
  return res.json();
}

export async function reviewTask(taskId: string, reviewerId: string, firmId: string, data: any) {
  const res = await fetch("/api/v1/tasks/" + taskId + "/review?firmId=" + firmId + "&reviewerId=" + reviewerId, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to review task");
  return res.json();
}

export async function overrideTask(taskId: string, data: any) {
  const res = await fetch("/api/v1/tasks/" + taskId + "/override", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to override task");
  return res.json();
}

export async function addSubtask(taskId: string, data: any) {
  const res = await fetch("/api/v1/tasks/" + taskId + "/subtasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to add subtask");
  return res.json();
}

export async function toggleSubtask(subtaskId: string, data: any) {
  const res = await fetch("/api/v1/subtasks/" + subtaskId, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to toggle subtask");
  return res.json();
}

export async function createProject(data: any) {
  const res = await fetch("/api/v1/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to create project");
  return res.json();
}

export async function updateProject(projectId: string, data: any) {
  const res = await fetch("/api/v1/projects/" + projectId, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to update project");
  return res.json();
}
export async function deleteProject(projectId: string) {
  const res = await fetch("/api/v1/projects/" + projectId, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete project");
  return res.json();
}
