import { supabase } from "./supabaseClient";
import { clearSupabaseAuthStorage } from "./supabaseAuthStorage";

export async function forceSignOut() {
  let signOutError = null;

  try {
    const timeoutMs = 2500;
    let timeoutId = null;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("Sign out timed out")), timeoutMs);
    });
    const res = await Promise.race([
      supabase.auth.signOut({ scope: "local" }),
      timeoutPromise,
    ]);
    if (timeoutId) clearTimeout(timeoutId);
    const error = res?.error;
    if (error) signOutError = error;
  } catch (err) {
    signOutError = err;
  }

  try {
    await supabase.auth.stopAutoRefresh();
  } catch (e) {}

  try {
    if (typeof supabase.auth._removeSession === "function") {
      await supabase.auth._removeSession();
    }
  } catch (e) {}

  clearSupabaseAuthStorage();
  try {
    window.dispatchEvent(new CustomEvent("flexfit-force-signout"));
  } catch (e) {}

  return signOutError;
}
