import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-client';

export function useTasks(firmId: string) {
  return useQuery({
    queryKey: ['tasks', firmId],
    queryFn: () => api.fetchTasks(firmId),
    enabled: !!firmId,
  });
}

export function useCreateTask(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createTask(firmId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', firmId] }),
  });
}

export function useUpdateTask(firmId: string, actorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) => api.updateTask(taskId, firmId, actorId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', firmId] }),
  });
}

export function useDeleteTask(firmId: string, actorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => api.deleteTask(taskId, firmId, actorId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', firmId] }),
  });
}

export function useReviewTask(firmId: string, reviewerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) => api.reviewTask(taskId, reviewerId, firmId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', firmId] }),
  });
}

export function useOverrideTask(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) => api.overrideTask(taskId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', firmId] }),
  });
}

export function useAddSubtask(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) => api.addSubtask(taskId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', firmId] }),
  });
}

export function useToggleSubtask(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subtaskId, data }: { subtaskId: string; data: any }) => api.toggleSubtask(subtaskId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', firmId] }),
  });
}
