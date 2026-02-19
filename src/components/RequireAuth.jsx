import React, { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../utils/auth";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const alertedRef = useRef(false);

  useEffect(() => {
    if (!user && !loading && !alertedRef.current) {
      alertedRef.current = true;
      alert("Sign in first");
    }
  }, [user, loading]);

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return children;
}
