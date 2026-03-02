import { supabase } from "./supabaseClient";
import { clearSupabaseAuthStorage } from "./supabaseAuthStorage";

export async function forceSignOut() {
  let signOutError = null;

  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) signOutError = error;
  } catch (err) {
    signOutError = err;
  }

  try {
    await supabase.auth.stopAutoRefresh();
  } catch (e) {}

  if (signOutError) {
    try {
      if (typeof supabase.auth._removeSession === "function") {
        await supabase.auth._removeSession();
      }
    } catch (e) {}
  }

  clearSupabaseAuthStorage();
  try {
    window.dispatchEvent(new CustomEvent("flexfit-force-signout"));
  } catch (e) {}

  return signOutError;
}
