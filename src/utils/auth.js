import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let session = null;
        const { data } = await supabase.auth.getSession();
        session = data?.session ?? null;

        if (!session) {
          const { data: refreshed } = await supabase.auth.refreshSession();
          session = refreshed?.session ?? null;
        }

        if (!mounted) return;
        setUser(session?.user ?? null);
      } catch (err) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handler = () => {
      setUser(null);
      setLoading(false);
    };
    window.addEventListener("flexfit-force-signout", handler);
    return () => window.removeEventListener("flexfit-force-signout", handler);
  }, []);

  return { user, loading };
}
