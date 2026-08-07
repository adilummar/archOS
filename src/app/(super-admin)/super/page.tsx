"use client";

import { useFirmStore } from "@/lib/store/firm.store";
import { useProjectStore } from "@/lib/store/project.store";
import { Building2, Users, FolderKanban, LogOut } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function SuperAdminPage() {
  const { firms, users } = useFirmStore();
  const { projects } = useProjectStore();
  const router = useRouter();

  const handleLogout = () => {
    // Just a demo logout action
    router.push("/");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--color-bg-canvas)",
    }}>
      {/* Super Admin Topbar */}
      <header style={{
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: "var(--color-bg-card)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ 
            width: 32, height: 32, borderRadius: "50%", 
            background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center" 
          }}>
            <Building2 size={16} color="#fff" />
          </div>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
            ArchStudio Master
          </span>
          <span style={{ fontSize: "var(--text-xs)", padding: "2px 6px", borderRadius: 4, background: "var(--color-destructive-muted)", color: "var(--color-destructive)", fontWeight: 600, marginLeft: 8 }}>
            SUPER ADMIN
          </span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "transparent", border: "none", color: "var(--color-text-muted)",
            fontSize: "var(--text-sm)", cursor: "pointer",
          }}
        >
          <LogOut size={16} /> Sign out
        </button>
      </header>

      {/* Main Content */}
      <main style={{ padding: "40px 32px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        
        {/* Global Stats */}
        <div style={{ display: "flex", gap: 24, marginBottom: 40 }}>
          <div style={{ flex: 1, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--color-text-secondary)", marginBottom: 12 }}>
              <Building2 size={20} />
              <h3 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 500 }}>Total Firms</h3>
            </div>
            <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {firms.length}
            </div>
          </div>
          
          <div style={{ flex: 1, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--color-text-secondary)", marginBottom: 12 }}>
              <Users size={20} />
              <h3 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 500 }}>Total Active Staff</h3>
            </div>
            <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {users.filter(u => u.status === 'active').length}
            </div>
          </div>

          <div style={{ flex: 1, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--color-text-secondary)", marginBottom: 12 }}>
              <FolderKanban size={20} />
              <h3 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 500 }}>Total Projects</h3>
            </div>
            <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {projects.length}
            </div>
          </div>
        </div>

        {/* Firms Table */}
        <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "24px", borderBottom: "1px solid var(--color-border)" }}>
            <h2 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-text-primary)" }}>
              Tenant Firms
            </h2>
          </div>
          
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--color-bg-canvas)" }}>
                <th style={{ padding: "16px 24px", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Firm Name</th>
                <th style={{ padding: "16px 24px", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Plan</th>
                <th style={{ padding: "16px 24px", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", textAlign: "right" }}>Staff Count</th>
                <th style={{ padding: "16px 24px", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", textAlign: "right" }}>Projects</th>
                <th style={{ padding: "16px 24px", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {firms.map((firm) => {
                const staffCount = users.filter((u) => u.firmId === firm.id && u.status === 'active').length;
                const projectCount = projects.filter((p) => p.firmId === firm.id).length;

                return (
                  <tr key={firm.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 4, background: "var(--color-bg-input)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontWeight: 600, fontSize: 14 }}>
                            {firm.name.charAt(0)}
                          </div>
                        <span style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)" }}>
                          {firm.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ 
                        fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                        padding: "4px 8px", borderRadius: 4,
                        background: firm.planType === 'enterprise' ? "var(--color-accent-muted)" : "var(--color-info-muted)",
                        color: firm.planType === 'enterprise' ? "var(--color-accent)" : "var(--color-info)",
                      }}>
                        {firm.planType}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", textAlign: "right" }}>
                      {staffCount}
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", textAlign: "right" }}>
                      {projectCount}
                    </td>
                    <td style={{ padding: "16px 24px", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {format(new Date(firm.createdAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                );
              })}
              {firms.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 48, textAlign: "center", color: "var(--color-text-muted)" }}>
                    No tenant firms registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
