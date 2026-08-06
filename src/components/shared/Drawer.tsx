"use client";
/**
 * Drawer — right-side slide, 440px, full-width mobile, ESC to close, backdrop closes.
 * Framer Motion: x: 440→0, 250ms ease-out.
 * Reduced motion: duration collapses to 0ms via CSS @media.
 */

import { useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Width in px. Defaults to 440. */
  width?: number;
  children: React.ReactNode;
}

export function Drawer({ open, onClose, title, width = 440, children }: DrawerProps) {
  // ESC to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    },
    [open, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgb(0 0 0 / 0.6)",
              zIndex: 50,
            }}
          />

          {/* Panel */}
          <motion.aside
            key="drawer-panel"
            initial={{ x: width }}
            animate={{ x: 0 }}
            exit={{ x: width }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(100vw, " + width + "px)",
              background: "var(--color-bg-card)",
              borderLeft: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-drawer)",
              zIndex: 51,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            {(title !== undefined) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--color-border)",
                  flexShrink: 0,
                }}
              >
                {title && (
                  <h2
                    style={{
                      fontSize: "var(--text-lg)",
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                      margin: 0,
                    }}
                  >
                    {title}
                  </h2>
                )}
                <button
                  id="drawer-close"
                  onClick={onClose}
                  aria-label="Close drawer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    borderRadius: "var(--radius-sm)",
                    background: "transparent",
                    border: "none",
                    color: "var(--color-text-muted)",
                    cursor: "pointer",
                    transition: "background var(--duration-fast), color var(--duration-fast)",
                    marginLeft: "auto",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-bg-card-hover)";
                    e.currentTarget.style.color = "var(--color-text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--color-text-muted)";
                  }}
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
            )}

            {/* Body — scrollable */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
              }}
            >
              {children}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
