"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useFirmStore } from "@/lib/store/firm.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { toast } from "@/lib/store/toast.store";
import { Building2, ArrowRight } from "lucide-react";

export default function ContractorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      setLoading(false);

      // Search all contractors for this email
      const { contractors, firms } = useFirmStore.getState();
      const contractor = contractors.find((c) => c.email.toLowerCase() === email.toLowerCase());

      if (!contractor) {
        toast("No contractor account found for this email.", "error");
        return;
      }

      // Check max sessions (reuse client setting or default)
      const firm = firms.find(f => f.id === contractor.firmId);
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
      const project = useProjectStore.getState().projects.find(p => p.contractorIds.includes(contractor.id));
      
      toast("Welcome to the Contractor Portal!", "success");
      
      if (project) {
        router.push(`/contractor/${project.id}`);
      } else {
        toast("No active projects found for your account.", "error");
        router.push(`/contractor/dashboard`);
      }
    }, 800);
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
            Enter your email to access the site portal.
          </p>

          <form onSubmit={handleEmailSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
              <label style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)" }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="contractor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                style={{
                  width: "100%",
                  height: 40,
                  padding: "0 14px",
                  background: "var(--color-bg-input)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-text-primary)",
                  fontSize: "var(--text-sm)",
                  outline: "none",
                  transition: "border-color var(--duration-fast)",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                width: "100%",
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "var(--color-accent)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                cursor: loading || !email.trim() ? "not-allowed" : "pointer",
                opacity: loading || !email.trim() ? 0.7 : 1,
                transition: "opacity var(--duration-fast)",
              }}
            >
              {loading ? "Logging in..." : "Login to Portal"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
