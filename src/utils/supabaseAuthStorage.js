// src/utils/supabaseAuthStorage.js
export const clearSupabaseAuthStorage = () => {
  try {
    if (typeof window === "undefined") return;

    const url = process.env.REACT_APP_SUPABASE_URL || "";
    const ref = url.replace(/^https?:\/\//, "").split(".")[0];
    const prefixes = [];
    const exactKeys = new Set(["flexfit-auth"]);
    const storageKeyPrefix = "flexfit-auth";

    if (ref) prefixes.push(`sb-${ref}-`);
    prefixes.push("supabase.auth.");
    prefixes.push(storageKeyPrefix);

    const shouldClear = (key) => {
      if (!key) return false;
      if (exactKeys.has(key)) return true;
      if (prefixes.some((p) => key.startsWith(p))) return true;
      if (key.startsWith("sb-")) return true;
      return false;
    };

    const clearStore = (store) => {
      if (!store) return;
      for (let i = store.length - 1; i >= 0; i -= 1) {
        const key = store.key(i);
        if (!key) continue;
        if (shouldClear(key)) {
          store.removeItem(key);
        }
      }
    };

    clearStore(window.localStorage);
    clearStore(window.sessionStorage);
  } catch (err) {
    // ignore storage errors
  }
};
