import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export const attendanceKeys = {
  all: (firmId: string) => ['attendance', firmId] as const,
  mine: (firmId: string, userId: string) => ['attendance', firmId, userId] as const,
  history: (firmId: string, userId: string) => ['attendance-history', firmId, userId] as const,
  breakdown: (sessionId: string) => ['attendance-breakdown', sessionId] as const,
  weekly: (firmId: string) => ['attendance-weekly', firmId] as const,
};

export function useWeeklyAttendance(firmId: string) {
  return useQuery({
    queryKey: attendanceKeys.weekly(firmId),
    queryFn: () => api.get<any[]>('/api/v1/attendance/weekly'),
    enabled: !!firmId,
  });
}

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
    queryClient.invalidateQueries({ queryKey: ['attendance-breakdown'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: attendanceKeys.weekly(firmId) });
    queryClient.invalidateQueries({ queryKey: ['staff', firmId] });
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
      mutationFn: (data: { projectId: string; taskId: string }) =>
        api.post<any>(`/api/v1/attendance/switch?firmId=${firmId}`, data),
      onSuccess: invalidate,
    }),
    stopCounting: useMutation({
      mutationFn: () =>
        api.post<any>(`/api/v1/attendance/stop-counting?firmId=${firmId}`, {}),
      onSuccess: invalidate,
    }),
  };
}
