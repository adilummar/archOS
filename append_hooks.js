const fs = require('fs');

const appendCode = `

export function useTeamLeadActiveTasks(firmId: string) {
  return useQuery({
    queryKey: ['tasks', 'team-lead', 'active', firmId],
    queryFn: async () => {
      const res = await fetch(\`/api/v1/tasks/team-lead?firmId=\${firmId}\`);
      if (!res.ok) throw new Error('Failed to fetch team lead active tasks');
      return res.json();
    },
    enabled: !!firmId,
  });
}

export function useTeamLeadReviewQueue(firmId: string) {
  return useQuery({
    queryKey: ['tasks', 'team-lead', 'reviews', firmId],
    queryFn: async () => {
      const res = await fetch(\`/api/v1/tasks/team-lead/reviews?firmId=\${firmId}\`);
      if (!res.ok) throw new Error('Failed to fetch review queue');
      return res.json();
    },
    enabled: !!firmId,
  });
}

export function useStaffAssignedTasks(firmId: string) {
  return useQuery({
    queryKey: ['tasks', 'staff', 'assigned', firmId],
    queryFn: async () => {
      const res = await fetch(\`/api/v1/tasks/staff?firmId=\${firmId}\`);
      if (!res.ok) throw new Error('Failed to fetch staff tasks');
      return res.json();
    },
    enabled: !!firmId,
  });
}

export function useAssignTaskSequence(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, dueDate, assigneeId }: { taskId: string, dueDate: string, assigneeId?: string }) => {
      const res = await fetch(\`/api/v1/tasks/\${taskId}/assign?firmId=\${firmId}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate, assigneeId })
      });
      if (!res.ok) {
         const d = await res.json().catch(() => ({}));
         throw new Error(d.error || d.message || 'Failed to assign task');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useSubmitTaskForReviewSequence(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      const res = await fetch(\`/api/v1/tasks/\${taskId}/submit-review?firmId=\${firmId}\`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to submit task');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useApproveTaskSequence(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      const res = await fetch(\`/api/v1/tasks/\${taskId}/approve?firmId=\${firmId}\`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to approve task');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useRequestTaskRevisionSequence(firmId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, remark, newDueDate }: { taskId: string, remark: string, newDueDate: string }) => {
      const res = await fetch(\`/api/v1/tasks/\${taskId}/request-revision?firmId=\${firmId}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remark, newDueDate })
      });
      if (!res.ok) throw new Error('Failed to request revision');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
`;
fs.appendFileSync('src/hooks/useTasks.ts', appendCode);
