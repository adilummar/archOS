/**
 * SkeletonCard and SkeletonRow — 1.2 second show on every data section mount.
 * Used before real data renders. Animated shimmer pulse.
 */

interface SkeletonCardProps {
  /** Number of skeleton cards to render. */
  count?: number;
  /** Height of each card in px. */
  height?: number;
}

export function SkeletonCard({ count = 3, height = 80 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton-pulse"
          style={{
            height,
            borderRadius: "var(--radius-md)",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            marginBottom: 8,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div className="skeleton-shimmer" />
        </div>
      ))}
      <style>{`
        @keyframes skeleton-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .skeleton-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgb(255 255 255 / 0.04) 50%,
            transparent 100%
          );
          animation: skeleton-shimmer 1.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .skeleton-shimmer { animation: none; }
        }
      `}</style>
    </>
  );
}

interface SkeletonRowProps {
  /** Number of skeleton rows. */
  count?: number;
  /** Show avatar column. */
  avatar?: boolean;
}

export function SkeletonRow({ count = 5, avatar = false }: SkeletonRowProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 16px",
            borderBottom: "1px solid var(--color-border)",
            position: "relative",
          }}
        >
          {avatar && (
            <div
              className="skeleton-pulse"
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-sm)",
                background: "var(--color-bg-card-hover)",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              <div className="skeleton-shimmer" />
            </div>
          )}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              className="skeleton-pulse"
              style={{
                height: 12,
                width: `${55 + (i % 3) * 15}%`,
                borderRadius: "var(--radius-sm)",
                background: "var(--color-bg-card-hover)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div className="skeleton-shimmer" />
            </div>
            <div
              className="skeleton-pulse"
              style={{
                height: 10,
                width: `${30 + (i % 4) * 10}%`,
                borderRadius: "var(--radius-sm)",
                background: "var(--color-bg-card)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div className="skeleton-shimmer" />
            </div>
          </div>
          <div
            className="skeleton-pulse"
            style={{
              height: 20,
              width: 64,
              borderRadius: "var(--radius-sm)",
              background: "var(--color-bg-card-hover)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div className="skeleton-shimmer" />
          </div>
        </div>
      ))}
    </>
  );
}
