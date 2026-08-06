"use client";
/**
 * Toast — global toast system driven by useToastStore.
 * Bottom-right, 3 second auto-dismiss, max 3 stacked.
 * Reduced motion: instantaneous.
 */

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { useToastStore, type ToastVariant } from "../../lib/store/toast.store";

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  default: {
    icon: <Info size={16} strokeWidth={2} />,
    color: "var(--color-text-primary)",
    bg: "var(--color-bg-elevated)",
    border: "var(--color-border-strong)",
  },
  success: {
    icon: <CheckCircle size={16} strokeWidth={2} />,
    color: "var(--color-success)",
    bg: "var(--color-bg-elevated)",
    border: "var(--color-border-strong)",
  },
  warning: {
    icon: <AlertTriangle size={16} strokeWidth={2} />,
    color: "var(--color-warning)",
    bg: "var(--color-bg-elevated)",
    border: "var(--color-border-strong)",
  },
  error: {
    icon: <XCircle size={16} strokeWidth={2} />,
    color: "var(--color-destructive)",
    bg: "var(--color-bg-elevated)",
    border: "var(--color-border-strong)",
  },
};

export function ToastProvider() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
        maxWidth: 360,
        width: "calc(100vw - 40px)",
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const cfg = VARIANT_CONFIG[t.variant];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                boxShadow: "var(--shadow-elevated)",
                pointerEvents: "auto",
              }}
            >
              <span style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }}>
                {cfg.icon}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-primary)",
                  lineHeight: 1.5,
                }}
              >
                {t.message}
              </span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  padding: 0,
                  display: "flex",
                  flexShrink: 0,
                  marginTop: 1,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
              >
                <X size={14} strokeWidth={2} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
