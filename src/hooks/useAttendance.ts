import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export const attendanceKeys = {
  all: (firmId: string) => ['attendance', firmId] as const,
  mine: (firmId: string, userId: string) => ['attendance', firmId, userId] as const,
  history: (firmId: string, userId: string) => ['attendance-history', firmId, userId] as const,
  breakdown: (sessionId: string) => ['attendance-breakdown', sessionId] as const,
};

export function useMyAttendance(firmId: string, userId: string) {
  return useQuery({
    queryKey: attendanceKeys.mine(firmId, userId),
    queryFn: () => api.get<any>(`/api/v1/attendance?firmId=${firmId}&userId=${userId}`),
    enabled: !!firmId && !!userId,
  });
}

export function useAttendanceHistory(firmId: string, userId: string) {
  return useQuery({
    queryKey: attendanceKeys.history(firmId, userId),
    queryFn: () => api.get<any[]>(`/api/v1/attendance/history?firmId=${firmId}&userId=${userId}`),
    enabled: !!firmId && !!userId,
  });
}

export function useTaskTimeBreakdown(sessionId: string) {
  return useQuery({
    queryKey: attendanceKeys.breakdown(sessionId),
    queryFn: () => api.get<any>(`/api/v1/attendance/breakdown?sessionId=${sessionId}`),
    enabled: !!sessionId,
  });
}

export function useAttendanceMutations(firmId: string, userId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: attendanceKeys.mine(firmId, userId) });
    queryClient.invalidateQueries({ queryKey: attendanceKeys.history(firmId, userId) });
    // breakdown uses sessionId which might change, invalidating all breakdowns is safest or we can let it be
    queryClient.invalidateQueries({ queryKey: ['attendance-breakdown'] });
  };

  return {
    checkIn: useMutation({
      mutationFn: (data: any) => api.post<any>(`/api/v1/attendance/check-in?firmId=${firmId}`, data),
      onSuccess: invalidate,
    }),
    checkOut: useMutation({
      mutationFn: ({ sessionId }: { sessionId: string }) => api.post<any>(`/api/v1/attendance/check-out?firmId=${firmId}`, { sessionId }),
      onSuccess: invalidate,
    }),
    startBreak: useMutation({
      mutationFn: ({ sessionId, type }: { sessionId: string, type: string }) => api.post<any>(`/api/v1/attendance/break-start?firmId=${firmId}`, { sessionId, type }),
      onSuccess: invalidate,
    }),
    endBreak: useMutation({
      mutationFn: ({ sessionId }: { sessionId: string }) => api.post<any>(`/api/v1/attendance/break-end?firmId=${firmId}`, { sessionId }),
      onSuccess: invalidate,
    }),
    switchTask: useMutation({
      mutationFn: (data: { sessionId: string; projectId?: string; taskId?: string }) => api.post<any>(`/api/v1/attendance/switch?firmId=${firmId}`, data),
      onSuccess: invalidate,
    }),
  };
}
