"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Prevent scrolling on body when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.6)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backdropFilter: "blur(4px)",
      }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        style={{
          background: "var(--color-bg-card)",
          borderRadius: "var(--radius-lg)",
          width: "100%",
          maxWidth: 440,
          boxShadow: "var(--shadow-modal)",
          overflow: "hidden",
          animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 24px 16px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: isDestructive ? "var(--color-destructive-muted)" : "var(--color-accent-muted)",
              color: isDestructive ? "var(--color-destructive)" : "var(--color-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                {title}
              </h2>
              <p style={{ margin: "8px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                {description}
              </p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            style={{ 
              background: "none", 
              border: "none", 
              cursor: "pointer", 
              color: "var(--color-text-muted)",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          background: "var(--color-bg-canvas)",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 16px",
              borderRadius: "var(--radius-sm)",
              background: "transparent",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 16px",
              borderRadius: "var(--radius-sm)",
              background: isDestructive ? "var(--color-destructive)" : "var(--color-accent)",
              color: "#fff",
              border: "none",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
