/**
 * EmptyState — specific copy, never "No data."
 * Every list and table must use this with appropriate message.
 */
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        gap: 16,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          borderRadius: "var(--radius-md)",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-muted)",
        }}
      >
        <Icon size={22} strokeWidth={1.5} />
      </span>
      <div style={{ maxWidth: 280 }}>
        <p
          style={{
            fontSize: "var(--text-base)",
            fontWeight: 500,
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-display)",
            margin: 0,
            marginBottom: 4,
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 4,
            padding: "7px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-accent)",
            color: "var(--color-text-inverse)",
            border: "none",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            cursor: "pointer",
            transition: "background var(--duration-fast)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-accent-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-accent)")}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
