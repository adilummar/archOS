import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export const leaveKeys = {
  all: (firmId: string) => ["leave", firmId] as const,
  list: (firmId: string, filter?: { status?: string; month?: string; userId?: string }) =>
    ["leave", firmId, filter] as const,
};

export function useLeaveRequests(firmId: string, filter?: { status?: string; month?: string; userId?: string }) {
  const queryParams = new URLSearchParams();
  if (filter?.status && filter.status !== "all") queryParams.set("status", filter.status);
  if (filter?.month) queryParams.set("month", filter.month);
  if (filter?.userId) queryParams.set("userId", filter.userId);
  const qs = queryParams.toString();

  return useQuery({
    queryKey: leaveKeys.list(firmId, filter),
    queryFn: () => api.get<any[]>(`/api/v1/leave${qs ? `?${qs}` : ""}`),
    enabled: !!firmId,
  });
}

export function useLeaveMutations(firmId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: leaveKeys.all(firmId) });
    queryClient.invalidateQueries({ queryKey: ["staff", firmId] });
  };

  return {
    createLeave: useMutation({
      mutationFn: (data: { type?: string; startDate: string; endDate: string; reason?: string }) =>
        api.post<any>("/api/v1/leave", data),
      onSuccess: invalidate,
    }),
    approveLeave: useMutation({
      mutationFn: ({ id, note }: { id: string; note?: string }) =>
        api.patch<any>(`/api/v1/leave/${id}/approve`, { note }),
      onSuccess: invalidate,
    }),
    rejectLeave: useMutation({
      mutationFn: ({ id, note }: { id: string; note: string }) =>
        api.patch<any>(`/api/v1/leave/${id}/reject`, { note }),
      onSuccess: invalidate,
    }),
    cancelLeave: useMutation({
      mutationFn: (id: string) =>
        api.patch<any>(`/api/v1/leave/${id}/cancel`, {}),
      onSuccess: invalidate,
    }),
  };
}
