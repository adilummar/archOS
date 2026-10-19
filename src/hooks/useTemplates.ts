import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { ProjectTemplate } from "@/lib/store/types";
import type { CreateTemplateInput, UpdateTemplateInput } from "@/lib/project-template";

export const templateKeys = {
  all: (firmId: string) => ["templates", firmId] as const,
};

export function useTemplates(firmId: string) {
  return useQuery({
    queryKey: templateKeys.all(firmId),
    queryFn: () => api.get<ProjectTemplate[]>("/api/v1/templates"),
    enabled: !!firmId,
  });
}

export function useCreateTemplate(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTemplateInput) =>
      api.post<ProjectTemplate>("/api/v1/templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all(firmId) });
    },
  });
}

export function useUpdateTemplate(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: UpdateTemplateInput }) =>
      api.patch<ProjectTemplate>(`/api/v1/templates/${templateId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all(firmId) });
    },
  });
}

export function useDeleteTemplate(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) =>
      api.delete<{ success: boolean; template: ProjectTemplate }>(`/api/v1/templates/${templateId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all(firmId) });
    },
  });
}
