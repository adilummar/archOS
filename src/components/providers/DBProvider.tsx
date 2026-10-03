"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth.store";
import { getFirmBySlug } from "@/app/actions/bootstrap.actions";
import { useFirmStore } from "@/lib/store/firm.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useTaskStore } from "@/lib/store/task.store";

export function DBProvider({ firmSlug }: { firmSlug: string }) {
  const params = useParams<{ firmSlug: string }>();
  const router = useRouter();
  

  useEffect(() => {
    async function loadFromDB() {
      if (!firmSlug) return;
      try {
        const firm = await getFirmBySlug(firmSlug);
        if (!firm) return;

        // Verify session
        const authRes = await fetch("/api/v1/auth/me");
        if (authRes.ok) {
          const { user } = await authRes.json();
          if (user) {
            useAuthStore.getState().login(user as any, firm as any);
          } else {
            useAuthStore.getState().logout();
            router.push('/login');
          }
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
      }
    }

    loadFromDB();
  }, [firmSlug, router]);

  return null;
}


