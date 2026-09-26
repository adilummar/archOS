"use client";

import { useState } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, LogIn, Eye, EyeOff } from "lucide-react";
import { ToastProvider } from "@/components/shared/Toast";
import { toast } from "@/lib/store/toast.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useFirmStore } from "@/lib/store/firm.store";
import type { Firm, User, Role } from "@/lib/store/types";

export default function LoginPage() {
  const params = useParams<{ firmSlug: string }>();
  const router = useRouter();
  const firmSlug = params.firmSlug;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doLogin = async (loginEmail: string, loginPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed. Please try again.");
        return;
      }

      // Session cookie is now set server-side (httpOnly).
      // Hydrate Zustand UI state from the authoritative server response.
      const { user: dbUser } = data as {
        user: {
          id: string;
          firmId: string;
          name: string;
          role: string;
          firm: {
            id: string;
            name: string;
            slug: string;
            email: string;
            phone: string;
            address: string;
            gstin?: string;
            website?: string;
            logo?: string;
            planType: string;
            createdAt: string;
          };
        };
      };

      // Build the Zustand-compatible firm object
      const firm: Firm = {
        id: dbUser.firm.id,
        name: dbUser.firm.name,
        slug: (dbUser.firm as any).slug || "",
        status: (dbUser.firm as any).status || "ACTIVE",
        onboardingState: (dbUser.firm as any).onboardingState || "COMPLETED",
        enabledFeatures: (dbUser.firm as any).enabledFeatures || [],
        logo: dbUser.firm.logo,
        address: dbUser.firm.address,
        phone: dbUser.firm.phone,
        email: dbUser.firm.email,
        gstin: dbUser.firm.gstin ?? "",
        website: dbUser.firm.website,
        planType: dbUser.firm.planType as Firm["planType"],
        priorityPeriodDays: 7,
        minimumTaskLeadTimeDays: 3,
        settings: {
          defaultFileRequestWindowDays: 7,
          clientApprovalReminderDays: 3,
          clientApprovalEscalateDays: 7,
          defaultCurrency: "INR",
          drawingNumberingEnabled: true,
          maxClientSessions: 3,
          portalBranding: {},
        },
        createdAt: dbUser.firm.createdAt,
      };

      const user: User = {
        id: dbUser.id,
        firmId: dbUser.firmId,
        name: dbUser.name,
        email: loginEmail.trim(),
        phone: "",
        role: dbUser.role as Role,
        designation: "",
        avatarInitials: dbUser.name.slice(0, 2).toUpperCase(),
        avatarColor: "#E85D04",
        costRatePerHour: 0,
        joinedAt: new Date().toISOString(),
        status: "active",
      };

      // Populate UI state (Zustand) — NOT used for authorization
      useAuthStore.getState().login(user, firm);
      useFirmStore.getState().addFirm(firm);

      toast(`Welcome back, ${dbUser.name}!`, "success");
      router.push(`/${firmSlug}/dashboard`);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    await doLogin(email, password);
  };

  return (
    <>
      <ToastProvider />
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-bg-canvas)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: "100%", maxWidth: 420 }}
        >
          {/* Card */}
          <div
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "36px 32px",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-accent-muted)",
                  border: "1px solid var(--color-accent-strong)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-accent)",
                  flexShrink: 0,
                }}
              >
                <Building2 size={18} strokeWidth={1.5} />
              </div>
              <div>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Arch OS
                </p>
                <h1 style={{ fontSize: "var(--text-xl)", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
                  Sign in
                </h1>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "var(--radius-sm)",
                  color: "#ef4444",
                  fontSize: "var(--text-sm)",
                  marginBottom: 20,
                }}
              >
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                  Email
                </label>
                <input name="email" type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@firm.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-primary)",
                    fontSize: "var(--text-base)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input name="password" type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "9px 40px 9px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-input)",
                      color: "var(--color-text-primary)",
                      fontSize: "var(--text-base)",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-text-muted)",
                      padding: 0,
                      display: "flex",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 4,
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "11px 20px",
                  borderRadius: "var(--radius-md)",
                  background: loading ? "var(--color-bg-card-hover)" : "var(--color-accent)",
                  color: loading ? "var(--color-text-muted)" : "white",
                  border: "none",
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background var(--duration-fast)",
                }}
              >
                {loading ? (
                  <span style={{ width: 16, height: 16, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                ) : (
                  <LogIn size={16} strokeWidth={2} />
                )}
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
            
            {/* Quick Login - DEV ONLY */}
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px dashed var(--color-border)" }}>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>
                Quick Login (Dev Only)
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Admin", email: "adil@coastaldesign.in" },
                  { label: "Team Lead", email: "priya@coastaldesign.in" },
                  { label: "Staff", email: "rahul@coastaldesign.in" },
                  { label: "Accounts", email: "sanjay@coastaldesign.in" },
                ].map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setEmail(account.email);
                      setPassword("archos@2024");
                      doLogin(account.email, "archos@2024");
                    }}
                    style={{
                      padding: "8px 12px",
                      background: "var(--color-bg-input)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-primary)",
                      cursor: "pointer",
                      transition: "background var(--duration-fast)",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "var(--color-bg-card-hover)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "var(--color-bg-input)")}
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}


