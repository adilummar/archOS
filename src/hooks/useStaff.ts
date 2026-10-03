import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export const staffKeys = {
  all: (firmId: string) => ['staff', firmId] as const,
  detail: (firmId: string, staffId: string) => ['staff', firmId, staffId] as const,
};

export function useStaff(firmId: string) {
  return useQuery({
    queryKey: staffKeys.all(firmId),
    queryFn: () => api.get<any[]>('/api/v1/staff', { firmId }),
    enabled: !!firmId,
  });
}

export function useStaffProfile(firmId: string, staffId: string) {
  return useQuery({
    queryKey: staffKeys.detail(firmId, staffId),
    queryFn: () => api.get<any>(`/api/v1/staff/${staffId}`, { firmId }),
    enabled: !!firmId && !!staffId,
  });
}

export function useAddStaff(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any>('/api/v1/staff', { ...data, firmId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKeys.all(firmId) }),
  });
}

export function useUpdateStaff(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, data }: { staffId: string; data: any }) => 
      api.patch<any>(`/api/v1/staff/${staffId}?firmId=${firmId}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all(firmId) });
      queryClient.invalidateQueries({ queryKey: staffKeys.detail(firmId, variables.staffId) });
    },
  });
}
