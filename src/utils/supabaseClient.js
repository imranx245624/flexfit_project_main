// src/utils/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const STORAGE_KEY = "flexfit-auth";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(" Missing Supabase env vars");
}

const resolveStorage = () => {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch (e) {}
  return undefined;
};

const storage = resolveStorage();

// Migrate legacy supabase auth key -> new key (keeps sessions after update)
try {
  if (storage && SUPABASE_URL) {
    const ref = SUPABASE_URL.replace(/^https?:\/\//, "").split(".")[0];
    const legacyKey = ref ? `sb-${ref}-auth-token` : null;
    if (legacyKey && !storage.getItem(STORAGE_KEY) && storage.getItem(legacyKey)) {
      storage.setItem(STORAGE_KEY, storage.getItem(legacyKey));
    }
  }
} catch (e) {}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage,
    storageKey: STORAGE_KEY,
  },
});

// expose to window for debugging in browser console (dev only)
try {
  if (typeof window !== "undefined") {
    window.supabase = supabase;
  }
} catch (e) {
  // ignore in non-browser env
}
