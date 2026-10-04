/** Clear persisted tenant UI state so a new login cannot inherit another firm's Zustand data. */
export function clearTenantPersistedState() {
  if (typeof window === "undefined") return;
  const prefixes = ["archos-"];
  for (const store of [window.localStorage, window.sessionStorage]) {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key && prefixes.some((p) => key.startsWith(p)) && key !== "archos-auth") {
        keys.push(key);
      }
    }
    for (const key of keys) store.removeItem(key);
  }
}
