/**
 * Avatar — initials fallback, deterministic color from name hash.
 * Sizes: sm=24px, md=32px, lg=40px. Tooltip on hover.
 */
"use client";

interface AvatarProps {
  name: string;
  /** Explicit override color (hex). Falls back to hash-derived color. */
  color?: string;
  /** Explicit initials override. */
  initials?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** Show name tooltip on hover. */
  tooltip?: boolean;
  className?: string;
  /** Extra inline styles (e.g. for stacking offset in AvatarGroup). */
  style?: React.CSSProperties;
}

// A curated palette of desaturated professional colors for avatar backgrounds.
const PALETTE = [
  "#e55230", "#5b8dd9", "#52a45e", "#d9a03a", "#a855f7",
  "#06b6d4", "#ec4899", "#f97316", "#84cc16", "#e11d48",
  "#8b5cf6", "#14b8a6", "#f59e0b", "#3b82f6", "#10b981",
];

/** Deterministic color from a name string (same name → same color). */
function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/** Extract initials from a name (up to 2 chars). */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const SIZE_PX: Record<string, number> = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 48,
};

const FONT_SIZE: Record<string, string> = {
  sm: "9px",
  md: "12px",
  lg: "14px",
  xl: "16px",
};

export function Avatar({
  name,
  color,
  initials,
  size = "md",
  tooltip = true,
  className = "",
  style: extraStyle,
}: AvatarProps) {
  const px = SIZE_PX[size] ?? 32;
  const fs = FONT_SIZE[size] ?? "12px";
  const bg = color ?? hashColor(name);
  const label = initials ?? getInitials(name);

  return (
    <span
      title={tooltip ? name : undefined}
      aria-label={name}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: px,
        height: px,
        borderRadius: "var(--radius-sm)",
        background: `${bg}22`,  // 13% opacity fill
        border: `1px solid ${bg}44`,
        color: bg,
        fontSize: fs,
        fontWeight: 600,
        fontFamily: "var(--font-body)",
        letterSpacing: "0.02em",
        flexShrink: 0,
        userSelect: "none",
        cursor: tooltip ? "default" : "inherit",
        ...extraStyle,
      }}
    >
      {label}
    </span>
  );
}

/** Stacked avatar group — shows up to `max` avatars then a +N overflow badge. */
interface AvatarGroupProps {
  names: string[];
  colors?: string[];
  size?: "sm" | "md" | "lg";
  max?: number;
}

export function AvatarGroup({ names, colors = [], size = "sm", max = 4 }: AvatarGroupProps) {
  const visible = names.slice(0, max);
  const overflow = names.length - max;

  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      {visible.map((name, i) => (
        <Avatar
          key={name + i}
          name={name}
          color={colors[i]}
          size={size}
          style={{ marginLeft: i > 0 ? -6 : 0, zIndex: visible.length - i }}
        />
      ))}
      {overflow > 0 && (
        <span
          title={`${overflow} more`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: SIZE_PX[size] ?? 24,
            height: SIZE_PX[size] ?? 24,
            borderRadius: "var(--radius-sm)",
            background: "var(--color-bg-card-hover)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
            fontSize: FONT_SIZE[size] ?? "9px",
            fontWeight: 500,
            marginLeft: -6,
            zIndex: 0,
            flexShrink: 0,
            userSelect: "none",
          }}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}
