"use client";

/**
 * Client Portal Auth
 * Simulates direct email login for clients.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFirmStore } from "@/lib/store/firm.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { toast } from "@/lib/store/toast.store";
import { Building2, ArrowRight } from "lucide-react";
import { seedAllStores } from "@/lib/demo/seed";

export default function ClientLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const allClients = useFirmStore((s) => s.clients);
  const clients = allClients.filter((c) => c.portalEnabled);

  useEffect(() => {
    seedAllStores();
  }, []);

  const handleLogin = (clientId: string) => {
    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      setLoading(false);

      const { clients, firms } = useFirmStore.getState();
      const client = clients.find((c) => c.id === clientId);

      if (!client) {
        toast("No client portal account found.", "error");
        return;
      }

      // Check max sessions
      const firm = firms.find((f) => f.id === client.firmId);
      const maxSessions = firm?.settings.maxClientSessions || 3;
      const currentSessions = parseInt(localStorage.getItem(`sessions_${client.id}`) || "0", 10);
      
      if (currentSessions >= maxSessions) {
        toast(`Maximum sessions (${maxSessions}) reached. Please log out from another device.`, "error");
        return;
      }

      // Increment simulated session counter
      localStorage.setItem(`sessions_${client.id}`, (currentSessions + 1).toString());

      // Log in to Zustand store
      useAuthStore.getState().loginPortal({
        type: "client",
        entityId: client.id,
        entityName: client.name,
        sessions: currentSessions + 1,
      });

      // Find client's primary project to redirect
      const project = useProjectStore.getState().projects.find((p) => p.clientId === client.id);
      
      toast(`Welcome back, ${client.name}!`, "success");
      
      if (project) {
        router.push(`/client/${project.id}`);
      } else {
        toast("No active projects found for your account.", "error");
        router.push(`/client/dashboard`);
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
            Client Portal
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
          boxShadow: "var(--shadow-card)",
        }}>
          <h1 style={{ margin: "0 0 8px", fontSize: "var(--text-2xl)", fontWeight: 600, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            Client Login
          </h1>
          <p style={{ margin: "0 0 32px", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Select your account to access the dashboard.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => handleLogin(client.id)}
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
                    {client.name}
                  </span>
                  {client.company && (
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {client.company}
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

