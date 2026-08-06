"use client";
/**
 * Firm login page — role selector for demo.
 * Task 2.2: /(firm-auth)/[firmSlug]/login/page.tsx
 *
 * Role pills: Admin / Team Lead / Staff / Accounts
 * "Load Demo Data & Enter" → seedAllStores → redirect to dashboard
 * Links: Client Portal → / Contractor Portal →
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, ArrowLeft, LogIn, ExternalLink } from "lucide-react";
import { seedAllStores } from "@/lib/demo/seed";
import { useFirmStore } from "@/lib/store/firm.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { toast } from "@/lib/store/toast.store";
import { ToastProvider } from "@/components/shared/Toast";
import type { Role } from "@/lib/store/types";

const ROLES: { role: Role; label: string; description: string }[] = [
  { role: "admin",     label: "Admin",      description: "Full access — finance, team, settings" },
  { role: "team_lead", label: "Team Lead",  description: "Projects, tasks, approvals" },
  { role: "staff",     label: "Staff",      description: "Assigned tasks and time tracking" },
  { role: "accounts",  label: "Accounts",   description: "Invoices, expenses, payroll" },
];

export default function LoginPage() {
  const params = useParams<{ firmSlug: string }>();
  const router = useRouter();
  const firmSlug = params.firmSlug;
  const firmId = `firm-${firmSlug}`;

  const [selectedRole, setSelectedRole] = useState<Role>("admin");
  const [loading, setLoading] = useState(false);

  const { firms, users } = useFirmStore();

  useEffect(() => {
    seedAllStores();
  }, []);

  const firm = firms.find((f) => f.id === firmId);
  const roleUsers = users.filter((u) => u.firmId === firmId && u.role === selectedRole && u.status === "active");
  const loginUser = roleUsers[0];

  const handleEnter = async () => {
    if (!firm || !loginUser) {
      toast("Could not find user for that role. Try reloading.", "error");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    useAuthStore.getState().login(loginUser, firm);
    toast(`Welcome, ${loginUser.name}!`, "success");
    router.push(`/${firmSlug}/dashboard`);
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
          style={{
            width: "100%",
            maxWidth: 440,
          }}
        >
          {/* Back button */}
          <button
            onClick={() => router.push("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              cursor: "pointer",
              padding: "0 0 24px",
              transition: "color var(--duration-fast)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
          >
            <ArrowLeft size={14} strokeWidth={2} />
            All firms
          </button>

          {/* Card */}
          <div
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "32px",
            }}
          >
            {/* Firm header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
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
                }}
              >
                <Building2 size={18} strokeWidth={1.5} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    margin: 0,
                    marginBottom: 2,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Signing into
                </p>
                <h1
                  style={{
                    fontSize: "var(--text-xl)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    margin: 0,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {firm?.name ?? "Loading…"}
                </h1>
              </div>
            </div>

            {/* Role selector */}
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text-muted)",
                marginBottom: 12,
                margin: "0 0 12px",
              }}
            >
              Select a role to enter as:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 28 }}>
              {ROLES.map((r) => {
                const isSelected = selectedRole === r.role;
                return (
                  <button
                    key={r.role}
                    id={`role-${r.role}`}
                    onClick={() => setSelectedRole(r.role)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: "var(--radius-md)",
                      background: isSelected ? "var(--color-accent-muted)" : "transparent",
                      border: `1px solid ${isSelected ? "var(--color-accent-strong)" : "var(--color-border)"}`,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all var(--duration-fast)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "var(--color-bg-card-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* Selection indicator */}
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: `2px solid ${isSelected ? "var(--color-accent)" : "var(--color-border-strong)"}`,
                        background: isSelected ? "var(--color-accent)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "white",
                          }}
                        />
                      )}
                    </span>
                    <span style={{ flex: 1 }}>
                      <span
                        style={{
                          display: "block",
                          fontSize: "var(--text-base)",
                          fontWeight: 500,
                          color: isSelected ? "var(--color-accent)" : "var(--color-text-primary)",
                          marginBottom: 2,
                        }}
                      >
                        {r.label}
                      </span>
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {r.description}
                      </span>
                    </span>
                    {loginUser && r.role === selectedRole && (
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-muted)",
                          flexShrink: 0,
                        }}
                      >
                        {loginUser.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Enter button */}
            <button
              id="btn-enter"
              onClick={handleEnter}
              disabled={loading || !loginUser}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 20px",
                borderRadius: "var(--radius-md)",
                background: loading ? "var(--color-bg-card-hover)" : "var(--color-accent)",
                color: loading ? "var(--color-text-muted)" : "var(--color-text-inverse)",
                border: "none",
                fontSize: "var(--text-base)",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background var(--duration-fast)",
                marginBottom: 20,
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = "var(--color-accent-hover)";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = "var(--color-accent)";
              }}
            >
              {loading ? (
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid var(--color-border-strong)",
                    borderTopColor: "var(--color-accent)",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
              ) : (
                <LogIn size={16} strokeWidth={2} />
              )}
              {loading ? "Loading demo data…" : "Load Demo Data & Enter"}
            </button>

            {/* Portal links */}
            <div
              style={{
                display: "flex",
                gap: 12,
                paddingTop: 16,
                borderTop: "1px solid var(--color-border)",
              }}
            >
              {[
                { label: "Client Portal →", href: `/client/login` },
                { label: "Contractor Portal →", href: `/contractor/login` },
              ].map((link) => (
                <button
                  key={link.label}
                  onClick={() => router.push(link.href)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    padding: "8px",
                    borderRadius: "var(--radius-sm)",
                    background: "transparent",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-muted)",
                    fontSize: "var(--text-xs)",
                    cursor: "pointer",
                    transition: "all var(--duration-fast)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--color-text-primary)";
                    e.currentTarget.style.borderColor = "var(--color-border-strong)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--color-text-muted)";
                    e.currentTarget.style.borderColor = "var(--color-border)";
                  }}
                >
                  <ExternalLink size={11} strokeWidth={2} />
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
}
