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
import { DBProvider } from "@/components/providers/DBProvider";

/** Map pathname segment → human readable page title */
function getPageTitle(pathname: string): string {
  const segment = pathname.split("/").pop() ?? "";
  const map: Record<string, string> = {
    dashboard: "Dashboard",
    staff: "Staff",
    projects: "Projects",
    tasks: "Tasks",
    attendance: "Attendance",
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Intercept uncompleted onboarding and unauthorized feature access
  useEffect(() => {
    if (!firm) return;
    if (firm.onboardingState !== "COMPLETED") {
      if (!pathname.includes("/onboarding")) {
        router.replace(`/${params.firmSlug}/onboarding`);
      }
      return;
    }

    // Map segments to feature keys
    const featureMap: Record<string, string> = {
      dashboard: "DASHBOARD",
      staff: "STAFF",
      projects: "PROJECTS",
      tasks: "TASKS",
      attendance: "ATTENDANCE",
      time: "TIME",
      leave: "LEAVE",
      meetings: "MEETINGS",
      rfi: "RFI",
      "site-reports": "SITE_REPORTS",
      crm: "CRM",
      finance: "FINANCE",
      "change-requests": "CHANGE_REQUESTS",
      "variation-orders": "VARIATION_ORDERS"
    };

    const segment = pathname.split("/").pop() ?? "";
    const requiredFeature = featureMap[segment];
    if (requiredFeature && !firm.enabledFeatures.includes(requiredFeature)) {
      router.replace(`/${params.firmSlug}/dashboard`);
    }
  }, [firm, pathname, params.firmSlug, router]);

  // Client-side redirect removed to prevent race conditions on hard reload.

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
      {/* DB data bridge — fetches from PostgreSQL and hydrates Zustand */}
      <DBProvider firmSlug={params.firmSlug} />
      <div className="flex min-h-screen">
        <Sidebar
          firmSlug={params.firmSlug}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0 relative">
          <Topbar title={pageTitle} firmSlug={params.firmSlug} onToggleMobile={() => setMobileOpen(true)} />
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
