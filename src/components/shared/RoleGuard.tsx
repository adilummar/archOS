"use client";

import { useAuthStore } from "@/lib/store/auth.store";
import type { Role } from "@/lib/store/types";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user } = useAuthStore();
  const router = useRouter();

  if (!user) return null; // Handled by outer auth guards usually

  if (!allowedRoles.includes(user.role)) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: "400px",
        padding: 48,
        textAlign: "center",
        color: "var(--color-text-primary)",
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--color-destructive-muted)",
          color: "var(--color-destructive)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}>
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ margin: "0 0 12px", fontSize: "var(--text-xl)", fontWeight: 600 }}>Access Denied</h2>
        <p style={{ margin: "0 0 32px", fontSize: "var(--text-base)", color: "var(--color-text-secondary)", maxWidth: 400 }}>
          You don't have the required permissions to view this page. If you believe this is an error, please contact your administrator.
        </p>
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: "var(--color-bg-input)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-text-primary)",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
