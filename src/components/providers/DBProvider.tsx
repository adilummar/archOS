"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth.store";

export function DBProvider({ firmSlug }: { firmSlug: string }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadFromDB() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          useAuthStore.getState().logout();
          router.push(firmSlug ? `/${firmSlug}/login` : "/");
          return;
        }
        const { user } = await authRes.json();
        if (!user?.firm) {
          useAuthStore.getState().logout();
          router.push(firmSlug ? `/${firmSlug}/login` : "/");
          return;
        }

        useAuthStore.getState().login(user, user.firm);

        const actualSlug = user.firm.slug as string | undefined;
        if (actualSlug && firmSlug && actualSlug !== firmSlug) {
          const suffix = pathname.startsWith(`/${firmSlug}`)
            ? pathname.slice(firmSlug.length + 1)
            : "/dashboard";
          router.replace(`/${actualSlug}${suffix || "/dashboard"}`);
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
      }
    }

    loadFromDB();
  }, [firmSlug, router, pathname]);

  return null;
}
