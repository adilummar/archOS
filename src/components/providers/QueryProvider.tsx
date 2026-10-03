"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth.store";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        retry: (failureCount, error: any) => {
          // Do not retry authorization or feature disabled errors
          if (error?.status === 401 || error?.status === 403) return false;
          return failureCount < 3;
        }
      },
    },
  }));

  const { user, firm } = useAuthStore();

  useEffect(() => {
    // Clear the cache whenever the user logs out or switches firms to guarantee no tenant data leakage.
    queryClient.clear();
  }, [user?.id, firm?.id, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
