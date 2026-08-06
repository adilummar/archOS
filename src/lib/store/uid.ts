/** Tiny id helper — crypto.randomUUID when available, fallback otherwise. */
export const uid = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

/** ISO timestamp helper (used by every store action). */
export const nowIso = (): string => new Date().toISOString();
