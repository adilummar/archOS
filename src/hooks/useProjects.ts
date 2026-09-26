import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-client';

export function useProjects(firmId: string) {
  return useQuery({
    queryKey: ['projects', firmId],
    queryFn: () => api.fetchProjects(firmId),
    enabled: !!firmId,
  });
}

export function useCreateProject(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createProject(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', firmId] }),
  });
}

export function useUpdateProject(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: any }) => api.updateProject(projectId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', firmId] }),
  });
}
export function useDeleteProject(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => api.deleteProject(projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', firmId] }),
  });
}
