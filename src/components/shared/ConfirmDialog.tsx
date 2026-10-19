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
        background: "rgba(0, 0, 0, 0.65)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backdropFilter: "blur(4px)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        className="t"
        style={{
          background: "linear-gradient(160deg, #3C3936 0%, #2B2927 100%)",
          borderRadius: "12px",
          width: "100%",
          maxWidth: 440,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 16px 36px rgba(0, 0, 0, 0.7)",
          overflow: "hidden",
          padding: 0,
          animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 24px 18px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: isDestructive ? "rgba(255, 107, 94, 0.15)" : "rgba(111, 220, 149, 0.15)",
              color: isDestructive ? "#FF6B5E" : "#6FDC95",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 500, color: "#FFFFFF" }}>
                {title}
              </h2>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#CFCAC4", lineHeight: 1.5 }}>
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
              color: "#9E9891",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          background: "rgba(0, 0, 0, 0.22)",
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: "9px 18px",
              borderRadius: "99px",
              background: "rgba(255, 255, 255, 0.08)",
              color: "#F3F1EE",
              border: "none",
              fontSize: "12px",
              fontWeight: 500,
              minHeight: "38px",
              cursor: "pointer",
              transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "9px 20px",
              borderRadius: "99px",
              background: isDestructive ? "#FF6B5E" : "linear-gradient(160deg, #2F7556 0%, #25563F 100%)",
              color: "#FFFFFF",
              border: "none",
              fontSize: "12px",
              fontWeight: 500,
              minHeight: "38px",
              cursor: "pointer",
              transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.96);
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
