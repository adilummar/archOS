"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFirmStore } from "@/lib/store/firm.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { toast } from "@/lib/store/toast.store";
import { Building2, ArrowRight } from "lucide-react";
import { seedAllStores } from "@/lib/demo/seed";

export default function ContractorLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const contractors = useFirmStore((s) => s.contractors);

  useEffect(() => {
    seedAllStores();
  }, []);

  const handleLogin = (contractorId: string) => {
    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      setLoading(false);

      const { contractors, firms } = useFirmStore.getState();
      const contractor = contractors.find((c) => c.id === contractorId);

      if (!contractor) {
        toast("No contractor account found.", "error");
        return;
      }

      // Check max sessions (reuse client setting or default)
      const firm = firms.find((f) => f.id === contractor.firmId);
      const maxSessions = firm?.settings.maxClientSessions || 3;
      const currentSessions = parseInt(localStorage.getItem(`sessions_${contractor.id}`) || "0", 10);
      
      if (currentSessions >= maxSessions) {
        toast(`Maximum sessions (${maxSessions}) reached. Please log out from another device.`, "error");
        return;
      }

      // Increment simulated session counter
      localStorage.setItem(`sessions_${contractor.id}`, (currentSessions + 1).toString());

      // Log in to Zustand store
      useAuthStore.getState().loginPortal({
        type: "contractor",
        entityId: contractor.id,
        entityName: contractor.name,
        sessions: currentSessions + 1,
      });

      // Find contractor's primary project to redirect
      const project = useProjectStore.getState().projects.find((p) => p.contractorIds.includes(contractor.id));
      
      toast(`Welcome to the Contractor Portal, ${contractor.name}!`, "success");
      
      if (project) {
        router.push(`/contractor/${project.id}`);
      } else {
        toast("No active projects found for your account.", "error");
        router.push(`/contractor/dashboard`);
      }
    }, 600);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--color-bg-canvas)",
    }}>
      {/* Topbar */}
      <header style={{
        height: 60,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-bg-card)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Building2 size={20} style={{ color: "var(--color-accent)" }} />
          <span style={{ fontSize: "var(--text-base)", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
            ArchStudio
          </span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginLeft: 4 }}>
            Contractor Portal
          </span>
        </div>
      </header>

      {/* Main content */}
      <main style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}>
        <div style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: 32,
          boxShadow: "var(--shadow-sm)",
        }}>
          <h1 style={{ margin: "0 0 8px", fontSize: "var(--text-2xl)", fontWeight: 600, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            Contractor Login
          </h1>
          <p style={{ margin: "0 0 32px", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Select your account to access the site portal.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {contractors.map((contractor) => (
              <button
                key={contractor.id}
                onClick={() => handleLogin(contractor.id)}
                disabled={loading}
                style={{
                  width: "100%",
                  height: 56,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 16px",
                  background: "var(--color-bg-input)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  transition: "all var(--duration-fast)",
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = "var(--color-accent)";
                    e.currentTarget.style.background = "var(--color-bg-card-hover)";
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.background = "var(--color-bg-input)";
                  }
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {contractor.name}
                  </span>
                  {contractor.company && (
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {contractor.company}
                    </span>
                  )}
                </div>
                <ArrowRight size={16} style={{ color: "var(--color-text-muted)" }} />
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
