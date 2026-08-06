"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { useRouter } from "next/navigation";

interface PortalHeaderProps {
  projectId: string;
  type?: "client" | "contractor";
}

export function PortalHeader({ projectId, type = "client" }: PortalHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { portalSession, logoutPortal } = useAuthStore();
  const { firms } = useFirmStore();

  // For a real app, you'd get the firmId from the project to get the right branding
  const firm = firms[0]; // fallback to first firm for demo if needed
  const branding = firm?.settings.portalBranding;

  const handleLogout = () => {
    logoutPortal();
    router.push(`/${type}/login`);
  };

  const clientNavItems = [
    { id: "overview", label: "Overview", path: `/client/${projectId}` },
    { id: "files", label: "Files", path: `/client/${projectId}/files` },
    { id: "chat", label: "Chat", path: `/client/${projectId}/chat` },
    { id: "invoices", label: "Invoices", path: `/client/${projectId}/invoices` },
    { id: "requests", label: "Requests", path: `/client/${projectId}/requests` },
  ];

  const contractorNavItems = [
    { id: "drawings", label: "Drawings", path: `/contractor/${projectId}` },
    { id: "rfi", label: "RFI", path: `/contractor/${projectId}/rfi` },
    { id: "progress", label: "Progress", path: `/contractor/${projectId}/progress` },
    { id: "punchlist", label: "Punch List", path: `/contractor/${projectId}/punchlist` },
  ];

  const navItems = type === "contractor" ? contractorNavItems : clientNavItems;
  const portalName = type === "contractor" ? "Contractor Portal" : "Client Portal";

  return (
    <header style={{
      background: "var(--color-bg-card)",
      borderBottom: "1px solid var(--color-border)",
      position: "sticky",
      top: 0,
      zIndex: 40,
    }}>
      {/* Top row: Branding & User actions */}
      <div style={{
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Building2 size={20} style={{ color: branding?.primaryColor || "var(--color-accent)" }} />
          <span style={{ fontSize: "var(--text-base)", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
            {firm?.name || "ArchStudio"}
          </span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginLeft: 4 }}>
            {portalName}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            {portalSession?.entityName}
          </span>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              color: "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              cursor: "pointer",
              transition: "color var(--duration-fast)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>

      {/* Bottom row: Tab navigation */}
      <div style={{ padding: "0 24px", display: "flex", gap: 24, overflowX: "auto" }}>
        {navItems.map((item) => {
          // Exact match for the root tab, prefix match for nested tabs
          const isActive = pathname === item.path || 
            (pathname.startsWith(item.path + "/") && item.path !== `/${type}/${projectId}`);
            
          return (
            <Link
              key={item.id}
              href={item.path}
              style={{
                textDecoration: "none",
                padding: "12px 0",
                fontSize: "var(--text-sm)",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                borderBottom: `2px solid ${isActive ? "var(--color-accent)" : "transparent"}`,
                transition: "all var(--duration-fast)",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
