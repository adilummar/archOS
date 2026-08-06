"use client";
/**
 * (firm-app) layout — wraps all firm portal pages with Sidebar + Topbar.
 * Redirects to login if no auth session.
 * Route group (app) ensures login page is NOT wrapped by this shell.
 * Task 2.3 + 2.4.
 */

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ToastProvider } from "@/components/shared/Toast";
import { useAuthStore } from "@/lib/store/auth.store";
import { seedAllStores } from "@/lib/demo/seed";

/** Map pathname segment → human readable page title */
function getPageTitle(pathname: string): string {
  const segment = pathname.split("/").pop() ?? "";
  const map: Record<string, string> = {
    dashboard: "Dashboard",
    projects: "Projects",
    tasks: "Tasks",
    time: "Time Tracker",
    leave: "Leave",
    meetings: "Meetings",
    rfi: "RFIs",
    "site-reports": "Site Reports",
    crm: "CRM",
    finance: "Finance",
    "change-requests": "Change Requests",
    "variation-orders": "Variation Orders",
    settings: "Settings",
  };
  return map[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

export default function FirmAppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams<{ firmSlug: string }>();
  const pathname = usePathname();
  const { user, firm } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Always ensure demo data seeded
    seedAllStores();
  }, []);

  // If no auth, redirect to login
  useEffect(() => {
    if (!user || !firm) {
      router.replace(`/${params.firmSlug}/login`);
    }
  }, [user, firm, params.firmSlug, router]);

  if (!user || !firm) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-bg-canvas)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            width: 24,
            height: 24,
            border: "2px solid var(--color-border-strong)",
            borderTopColor: "var(--color-accent)",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
            display: "block",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const pageTitle = getPageTitle(pathname);

  return (
    <>
      <ToastProvider />
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar
          firmSlug={params.firmSlug}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Topbar title={pageTitle} firmSlug={params.firmSlug} />
          <main
            style={{
              flex: 1,
              background: "var(--color-bg-canvas)",
              overflowY: "auto",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
