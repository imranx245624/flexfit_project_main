import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../utils/auth";
import { toast } from "../utils/toast";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const alertedRef = useRef(false);
  const location = useLocation();

  useEffect(() => {
    if (!user && !loading && !alertedRef.current) {
      alertedRef.current = true;
      try {
        const dest = location.pathname + location.search;
        sessionStorage.setItem("ff-auth-redirect", dest);
      } catch (e) {}
      try {
        window.dispatchEvent(new CustomEvent("flexfit-open-signin"));
      } catch (e) {}
      toast("Please sign in to continue.", { type: "info" });
    }
  }, [user, loading, location]);

  if (loading) return null;
  if (!user) {
    return (
      <div className="auth-guard container">
        <div className="ff-card">
          <h1>Sign in required</h1>
          <p className="small-muted">
            This page is available after you sign in. We will keep your place once you log in.
          </p>
          <div className="auth-guard-actions">
            <button
              className="btn"
              type="button"
              onClick={() => {
                try { window.dispatchEvent(new CustomEvent("flexfit-open-signin")); } catch (e) {}
              }}
            >
              Sign in
            </button>
            <Link className="btn-ghost" to="/">Go home</Link>
          </div>
        </div>
      </div>
    );
  }
  return children;
}
