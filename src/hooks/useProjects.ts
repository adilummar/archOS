import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Project } from '@/lib/store/types';

export const projectKeys = {
  all: (firmId: string) => ['projects', firmId] as const,
  detail: (firmId: string, projectId: string) => ['projects', firmId, projectId] as const,
};

export function useProjects(firmId: string) {
  return useQuery({
    queryKey: projectKeys.all(firmId),
    queryFn: () => api.get<Project[]>('/api/v1/projects', { firmId }),
    enabled: !!firmId,
  });
}

export function useProject(firmId: string, projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(firmId, projectId),
    queryFn: () => api.get<Project>(`/api/v1/projects/${projectId}`, { firmId }),
    enabled: !!firmId && !!projectId,
  });
}

export function useCreateProject(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any>('/api/v1/projects', { ...data, firmId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all(firmId) });
    },
  });
}

export function useInstantiateProject(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any>('/api/v1/projects/instantiate', { ...data, firmId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all(firmId) });
    },
  });
}

export function useUpdateProject(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: any }) => 
      api.patch<any>(`/api/v1/projects/${projectId}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all(firmId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(firmId, variables.projectId) });
    },
  });
}

export function useDeleteProject(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => api.delete<any>(`/api/v1/projects/${projectId}?firmId=${firmId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all(firmId) });
    },
  });
}

export function useCreateClient(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any>('/api/v1/clients', { ...data, firmId }),
    onSuccess: () => {
      // Typically you'd invalidate a clients query here if one existed
      queryClient.invalidateQueries({ queryKey: projectKeys.all(firmId) });
    },
  });
}
