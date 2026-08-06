"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useFirmStore } from "@/lib/store/firm.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { toast } from "@/lib/store/toast.store";
import { OTPInput } from "@/components/shared/OTPInput";
import { Building2, ArrowRight, ArrowLeft } from "lucide-react";

export default function ContractorLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [matchedContractor, setMatchedContractor] = useState<{ id: string; name: string; firmId: string } | null>(null);

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

      setMatchedContractor({ id: contractor.id, name: contractor.name, firmId: contractor.firmId });
      setStep("otp");
      
      // Simulate sending OTP
      toast("Your OTP is 123456", "info");
    }, 800);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6 || !matchedContractor) return;

    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      setLoading(false);
      if (otp !== "123456") {
        toast("Invalid OTP code.", "error");
        return;
      }

      // Increment simulated session counter
      const currentSessions = parseInt(localStorage.getItem(`sessions_${matchedContractor.id}`) || "0", 10);
      localStorage.setItem(`sessions_${matchedContractor.id}`, (currentSessions + 1).toString());

      // Log in to Zustand store
      useAuthStore.getState().loginPortal({
        type: "contractor",
        entityId: matchedContractor.id,
        entityName: matchedContractor.name,
        sessions: currentSessions + 1,
      });

      // Find contractor's primary project to redirect
      const project = useProjectStore.getState().projects.find(p => p.contractorIds.includes(matchedContractor.id));
      
      toast("Welcome to the Contractor Portal!", "success");
      
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
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ marginBottom: 32, textAlign: "center" }}>
                  <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
                    Contractor Access
                  </h1>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                    Enter your email to receive a secure login code.
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contractor@example.com"
                      required
                      style={{
                        padding: "10px 14px",
                        fontSize: "var(--text-base)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg-input)",
                        color: "var(--color-text-primary)",
                        outline: "none",
                        transition: "border var(--duration-fast)",
                      }}
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    style={{
                      padding: "12px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-accent)",
                      color: "#fff",
                      border: "none",
                      fontSize: "var(--text-sm)",
                      fontWeight: 600,
                      cursor: loading || !email.trim() ? "not-allowed" : "pointer",
                      opacity: loading || !email.trim() ? 0.7 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "opacity var(--duration-fast)",
                    }}
                  >
                    {loading ? "Checking..." : (
                      <>Continue <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ marginBottom: 32, textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                    <button
                      onClick={() => { setStep("email"); setOtp(""); }}
                      style={{
                        background: "var(--color-bg-input)",
                        border: "none",
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-text-secondary)",
                        cursor: "pointer",
                      }}
                      title="Back to email"
                    >
                      <ArrowLeft size={16} />
                    </button>
                  </div>
                  <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 8px" }}>
                    Enter secure code
                  </h1>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                    We sent a 6-digit code to <strong>{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleOtpSubmit} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                  <OTPInput
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    onComplete={() => {}}
                  />

                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    style={{
                      padding: "12px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-accent)",
                      color: "#fff",
                      border: "none",
                      fontSize: "var(--text-sm)",
                      fontWeight: 600,
                      cursor: loading || otp.length < 6 ? "not-allowed" : "pointer",
                      opacity: loading || otp.length < 6 ? 0.7 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "opacity var(--duration-fast)",
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
