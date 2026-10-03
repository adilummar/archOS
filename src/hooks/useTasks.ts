import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Task } from '@/lib/store/types';

export function useTasks(firmId: string) {
  return useQuery({
    queryKey: ['tasks', firmId],
    queryFn: () => api.get<Task[]>('//api/v1/tasks', { firmId }),
    enabled: !!firmId,
  });
}

export function useCreateTask(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any>('/api/v1/tasks', { ...data, firmId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', firmId] }),
  });
}

export function useUpdateTask(firmId: string, actorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) => api.patch<any>(`/api/v1/tasks/${taskId}?firmId=${firmId}&actorId=${actorId}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', firmId] }),
  });
}

export function useDeleteTask(firmId: string, actorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => api.delete<any>(`/api/v1/tasks/${taskId}?firmId=${firmId}&actorId=${actorId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', firmId] }),
  });
}

// Additional specific routes
export function useReviewTask(firmId: string, reviewerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) => api.post<any>(`/api/v1/tasks/${taskId}/review?firmId=${firmId}&reviewerId=${reviewerId}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', firmId] }),
  });
}

export function useOverrideTask(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) => api.post<any>(`/api/v1/tasks/${taskId}/override?firmId=${firmId}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', firmId] }),
  });
}

export function useAddSubtask(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) => api.post<any>(`/api/v1/tasks/${taskId}/subtasks`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', firmId] }),
  });
}

export function useToggleSubtask(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subtaskId, data }: { subtaskId: string; data: any }) => api.patch<any>(`/api/v1/subtasks/${subtaskId}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', firmId] }),
  });
}

export function useTeamLeadActiveTasks(firmId: string) {
  return useQuery({
    queryKey: ['tasks', 'team-lead', 'active', firmId],
    queryFn: () => api.get<Task[]>('//api/v1/tasks/team-lead', { firmId }),
    enabled: !!firmId,
  });
}

export function useTeamLeadReviewQueue(firmId: string) {
  return useQuery({
    queryKey: ['tasks', 'team-lead', 'reviews', firmId],
    queryFn: () => api.get<Task[]>('//api/v1/tasks/team-lead/reviews', { firmId }),
    enabled: !!firmId,
  });
}

export function useStaffAssignedTasks(firmId: string) {
  return useQuery({
    queryKey: ['tasks', 'staff', 'assigned', firmId],
    queryFn: () => api.get<Task[]>('//api/v1/tasks/staff', { firmId }),
    enabled: !!firmId,
  });
}

export function useAssignTaskSequence(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, dueDate, assigneeId }: { taskId: string, dueDate: string | null, assigneeId?: string }) => 
      api.post<any>(`/api/v1/tasks/${taskId}/assign?firmId=${firmId}`, { dueDate, assigneeId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useStartTaskSequence(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId }: { taskId: string }) => api.post<any>(`/api/v1/tasks/${taskId}/start?firmId=${firmId}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useSubmitTaskForReviewSequence(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId }: { taskId: string }) => api.post<any>(`/api/v1/tasks/${taskId}/submit-review?firmId=${firmId}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useApproveTaskSequence(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId }: { taskId: string }) => api.post<any>(`/api/v1/tasks/${taskId}/approve?firmId=${firmId}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useRequestTaskRevisionSequence(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, remark, newDueDate }: { taskId: string, remark: string, newDueDate: string }) => 
      api.post<any>(`/api/v1/tasks/${taskId}/request-revision?firmId=${firmId}`, { remark, newDueDate }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
