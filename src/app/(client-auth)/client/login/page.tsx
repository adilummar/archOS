"use client";

/**
 * Client Portal Auth — Phase 9.1
 * Simulates email -> OTP login for clients.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useFirmStore } from "@/lib/store/firm.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { toast } from "@/lib/store/toast.store";
import { OTPInput } from "@/components/shared/OTPInput";
import { Building2, ArrowRight, ArrowLeft } from "lucide-react";

export default function ClientLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [matchedClient, setMatchedClient] = useState<{ id: string; name: string; firmId: string } | null>(null);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      setLoading(false);

      // Search all clients for this email
      const { clients, firms } = useFirmStore.getState();
      const client = clients.find((c) => c.email.toLowerCase() === email.toLowerCase());

      if (!client) {
        toast("No client portal account found for this email.", "error");
        return;
      }

      if (!client.portalEnabled) {
        toast("Your portal access is disabled. Please contact your architect.", "error");
        return;
      }

      // Check max sessions
      const firm = firms.find(f => f.id === client.firmId);
      const maxSessions = firm?.settings.maxClientSessions || 3;
      const currentSessions = parseInt(localStorage.getItem(`sessions_${client.id}`) || "0", 10);
      
      if (currentSessions >= maxSessions) {
        toast(`Maximum sessions (${maxSessions}) reached. Please log out from another device.`, "error");
        return;
      }

      setMatchedClient({ id: client.id, name: client.name, firmId: client.firmId });
      setStep("otp");
      
      // Simulate sending OTP
      toast("Your OTP is 123456", "info");
    }, 800);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6 || !matchedClient) return;

    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      setLoading(false);
      if (otp !== "123456") {
        toast("Invalid OTP code.", "error");
        return;
      }

      // Increment simulated session counter
      const currentSessions = parseInt(localStorage.getItem(`sessions_${matchedClient.id}`) || "0", 10);
      localStorage.setItem(`sessions_${matchedClient.id}`, (currentSessions + 1).toString());

      // Log in to Zustand store
      useAuthStore.getState().loginPortal({
        type: "client",
        entityId: matchedClient.id,
        entityName: matchedClient.name,
        sessions: currentSessions + 1,
      });

      // Find client's primary project to redirect
      const project = useProjectStore.getState().projects.find(p => p.clientId === matchedClient.id);
      
      toast("Welcome back!", "success");
      
      if (project) {
        router.push(`/client/${project.id}`);
      } else {
        toast("No active projects found for your account.", "error");
        // We still log them in, maybe they can see an empty dashboard later.
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
          position: "relative",
          overflow: "hidden",
        }}>
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                  <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
                    Welcome to your portal
                  </h1>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: 0 }}>
                    Enter your email to receive a secure login code.
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit}>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. hello@example.com"
                      required
                      autoFocus
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        fontSize: "var(--text-base)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg-input)",
                        color: "var(--color-text-primary)",
                        outline: "none",
                        transition: "border-color var(--duration-fast)",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "var(--radius-sm)",
                      background: loading ? "var(--color-bg-input)" : "var(--color-accent)",
                      color: loading ? "var(--color-text-muted)" : "#fff",
                      border: "none",
                      fontSize: "var(--text-base)",
                      fontWeight: 500,
                      cursor: loading || !email.trim() ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "all var(--duration-fast)",
                    }}
                  >
                    {loading ? "Sending..." : "Continue with Email"}
                    {!loading && <ArrowRight size={16} />}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "transparent",
                    border: "none",
                    color: "var(--color-text-muted)",
                    fontSize: "var(--text-sm)",
                    cursor: "pointer",
                    padding: 0,
                    marginBottom: 24,
                  }}
                >
                  <ArrowLeft size={14} /> Back
                </button>

                <div style={{ textAlign: "center", marginBottom: 32 }}>
                  <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
                    Enter login code
                  </h1>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: 0 }}>
                    We sent a 6-digit code to <strong style={{ color: "var(--color-text-primary)" }}>{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleOtpSubmit}>
                  <div style={{ marginBottom: 32 }}>
                    <OTPInput length={6} value={otp} onChange={setOtp} disabled={loading} />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "var(--radius-sm)",
                      background: loading || otp.length < 6 ? "var(--color-bg-input)" : "var(--color-accent)",
                      color: loading || otp.length < 6 ? "var(--color-text-muted)" : "#fff",
                      border: "none",
                      fontSize: "var(--text-base)",
                      fontWeight: 500,
                      cursor: loading || otp.length < 6 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all var(--duration-fast)",
                    }}
                  >
                    {loading ? "Verifying..." : "Sign In"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
