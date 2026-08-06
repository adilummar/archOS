"use client";
/**
 * Root landing — Firm selector (SaaS landing).
 * Two firm cards from demo data. Click → firm login.
 * Task 2.1: (root)/page.tsx
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, MapPin, Users, Briefcase, ArrowRight, Layers } from "lucide-react";
import { seedAllStores } from "@/lib/demo/seed";
import { useFirmStore } from "@/lib/store/firm.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useTaskStore } from "@/lib/store/task.store";
import { ToastProvider } from "@/components/shared/Toast";
import type { Firm } from "@/lib/store/types";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

function FirmCard({
  firm,
  index,
  onClick,
}: {
  firm: Firm;
  index: number;
  onClick: () => void;
}) {
  const { users } = useFirmStore();
  const { projects } = useProjectStore();
  const { tasks } = useTaskStore();

  const staffCount = users.filter((u) => u.firmId === firm.id && u.status === "active").length;
  const projectCount = projects.filter((p) => p.firmId === firm.id && p.status === "active").length;
  const taskCount = tasks.filter((t) => t.firmId === firm.id && t.status !== "done" && t.status !== "approved").length;

  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 + 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        background: hovered ? "var(--color-bg-card-hover)" : "var(--color-bg-card)",
        border: `1px solid ${hovered ? "var(--color-border-strong)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-lg)",
        padding: "28px 32px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all var(--duration-base) var(--ease-out)",
        boxShadow: hovered ? "var(--shadow-card)" : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle accent glow on hover */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "var(--color-accent-muted)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />
      )}

      <div style={{ position: "relative" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Firm icon */}
            <div
              style={{
                width: 44,
                height: 44,
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
              <Building2 size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "var(--text-xl)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  margin: 0,
                  marginBottom: 2,
                  letterSpacing: "-0.02em",
                }}
              >
                {firm.name}
              </h2>
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: 500,
                  color: "var(--color-accent)",
                  background: "var(--color-accent-muted)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-sm)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {PLAN_LABELS[firm.planType] ?? firm.planType}
              </span>
            </div>
          </div>

          <div
            style={{
              color: hovered ? "var(--color-accent)" : "var(--color-text-muted)",
              transition: "all var(--duration-fast)",
              transform: hovered ? "translateX(4px)" : "translateX(0)",
            }}
          >
            <ArrowRight size={18} strokeWidth={1.5} />
          </div>
        </div>

        {/* Address */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 6,
            marginBottom: 24,
            color: "var(--color-text-muted)",
          }}
        >
          <MapPin size={13} strokeWidth={1.5} style={{ marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: "var(--text-sm)", lineHeight: 1.5 }}>{firm.address}</span>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            borderTop: "1px solid var(--color-border)",
            paddingTop: 20,
          }}
        >
          {[
            { icon: <Users size={14} strokeWidth={1.5} />, value: staffCount, label: "Staff" },
            { icon: <Briefcase size={14} strokeWidth={1.5} />, value: projectCount, label: "Active Projects" },
            { icon: <Layers size={14} strokeWidth={1.5} />, value: taskCount, label: "Open Tasks" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "0 8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  color: "var(--color-text-muted)",
                }}
              >
                {stat.icon}
              </div>
              <span
                style={{
                  fontSize: "var(--text-xl)",
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  color: "var(--color-text-primary)",
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.button>
  );
}

export default function Home() {
  const router = useRouter();
  const { firms } = useFirmStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedAllStores();
    setReady(true);
  }, []);

  const handleSelectFirm = (firm: Firm) => {
    const slug = firm.id.replace("firm-", "");
    router.push(`/${slug}/login`);
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
        }}
      >
        {/* Header bar */}
        <header
          style={{
            borderBottom: "1px solid var(--color-border)",
            padding: "16px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-md)",
                background: "var(--color-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Building2 size={18} strokeWidth={1.5} color="#fff" />
            </div>
            <span
              style={{
                fontSize: "var(--text-lg)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              ArchStudio
            </span>
          </div>
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              padding: "4px 10px",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.03em",
            }}
          >
            Demo Mode
          </span>
        </header>

        {/* Main content */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
          }}
        >
          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: "center", marginBottom: 48, maxWidth: 560 }}
          >
            <h1
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: 0,
                marginBottom: 12,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              Select your firm workspace
            </h1>
            <p
              style={{
                fontSize: "var(--text-lg)",
                color: "var(--color-text-muted)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Two demo firms pre-loaded with realistic project data.
              <br />
              Choose one to continue.
            </p>
          </motion.div>

          {/* Firm cards */}
          <div
            style={{
              width: "100%",
              maxWidth: 720,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {ready &&
              firms.map((firm, i) => (
                <FirmCard
                  key={firm.id}
                  firm={firm}
                  index={i}
                  onClick={() => handleSelectFirm(firm)}
                />
              ))}
            {!ready && (
              <>
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 260,
                      borderRadius: "var(--radius-lg)",
                      background: "var(--color-bg-card)",
                      border: "1px solid var(--color-border)",
                    }}
                  />
                ))}
              </>
            )}
          </div>

          {/* Bottom note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            style={{
              marginTop: 40,
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              textAlign: "center",
              maxWidth: 400,
              lineHeight: 1.6,
            }}
          >
            This is a frontend-only demo. All data is stored in memory and resets on page refresh.
          </motion.p>
        </main>

        {/* Footer */}
        <footer
          style={{
            borderTop: "1px solid var(--color-border)",
            padding: "14px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            ArchStudio — SaaS platform for architecture practices
          </span>
        </footer>
      </div>
    </>
  );
}
