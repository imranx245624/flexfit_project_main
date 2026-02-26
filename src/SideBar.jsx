// src/SideBar.jsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./sidebar.css";
import { supabase } from "./utils/supabaseClient";
import ConfirmSignOutModal from "./components/ConfirmSignOutModal.jsx";
import { useAuth } from "./utils/auth";
import { clearSupabaseAuthStorage } from "./utils/supabaseAuthStorage";

const ICONS = {
  home: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M4 11.5L12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z" fill="currentColor" />
    </svg>
  ),
  dashboard: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M3 3h9v9H3V3zm10 0h8v6h-8V3zM13 10h8v11h-8V10zM3 13h9v8H3v-8z" fill="currentColor" />
    </svg>
  ),
  library: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M5 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 4h7v2H7V7zm0 4h7v2H7v-2zm0 4h5v2H7v-2z" fill="currentColor" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M9 3h6v2h2a2 2 0 0 1 2 2v2h2v6h-2v2a2 2 0 0 1-2 2h-2v2H9v-2H7a2 2 0 0 1-2-2v-2H3v-6h2V7a2 2 0 0 1 2-2h2V3zm-2 6v6h10V9H7zm3-2h4V5h-4v2zm0 10h4v2h-4v-2z" fill="currentColor" />
    </svg>
  ),
  ranking: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M4 20h4V10H4v10zm6 0h4V4h-4v16zm6 0h4v-7h-4v7z" fill="currentColor" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M12 3l1.6 2.7 3-.2.8 3 2.6 1.5-1.5 2.6 1.5 2.6-2.6 1.5-.8 3-3-.2L12 21l-1.6-2.7-3 .2-.8-3-2.6-1.5 1.5-2.6-1.5-2.6 2.6-1.5.8-3 3 .2L12 3zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="currentColor" />
    </svg>
  ),
  signout: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M20 3H12a2 2 0 0 0-2 2v4h2V5h8v14h-8v-4h-2v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" fill="currentColor" />
      <path d="M13 8l-4 4 4 4v-3h8v-2h-8V8z" fill="currentColor" />
    </svg>
  ),
};

export default function SideBar({ open = true, setOpen }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const width = expanded ? "220px" : "88px";
    document.documentElement.style.setProperty("--sidebar-width", width);
    return () => {
      document.documentElement.style.setProperty("--sidebar-width", "88px");
    };
  }, [expanded]);

  const navItems = useMemo(() => ([
    { label: "Home", to: "/", icon: ICONS.home },
    { label: "MY Progress", to: "/progress", icon: ICONS.dashboard },
    { label: "Workout Library", to: "/workouts", icon: ICONS.library },
    { label: "AI Workout", to: "/AIWorkoutLibrary", icon: ICONS.ai },
    { label: "Flex Rankings", to: "/leaderboard", icon: ICONS.ranking },
  ]), []);

  const bottomItems = useMemo(() => ([
    { label: "Settings", to: "/settings", icon: ICONS.settings },
  ]), []);

  const handleSignOut = async () => {
    try {
      try { sessionStorage.setItem("ff-manual-signout", "1"); } catch (e) {}
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      alert("Signed out");
    } catch (err) {
      console.error("Sidebar sign out error:", err);
      alert("Sign out failed: " + (err.message || err));
    } finally {
      clearSupabaseAuthStorage();
      try { navigate("/", { replace: true }); } catch (e) {}
      try { window.location.replace("/"); } catch (e) {}
    }
  };

  const confirmAndSignOut = async () => {
    setShowConfirm(false);
    await handleSignOut();
  };

  const handleProtectedClick = (e, to) => {
    if (user || to === "/") return;
    e.preventDefault();
    e.stopPropagation();
    alert("Sign in first");
    try { window.dispatchEvent(new CustomEvent("flexfit-open-signin")); } catch (err) {}
  };

  if (!open) return null;

  return (
    <aside className={`sidebar ${expanded ? "expanded" : "collapsed"}`} aria-label="Sidebar">
      <div className="sidebar-top">
        <button
          className="sidebar-toggle"
          type="button"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded && <span className="toggle-brand">FlexFit</span>}
          <span className="toggle-arrow">{expanded ? "<" : ">"}</span>
        </button>
      </div>

      <nav className="sidebar-links" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="sidebar-link"
            aria-label={item.label}
            title={item.label}
            onClick={(e) => handleProtectedClick(e, item.to)}
          >
            {({ isActive }) => (
              <button className={`sidebar-btn ${isActive ? "active" : ""}`} type="button">
                <span className="icon">{item.icon}</span>
                <span className="label">{item.label}</span>
              </button>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom" aria-label="Secondary">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="sidebar-link"
            aria-label={item.label}
            title={item.label}
            onClick={(e) => handleProtectedClick(e, item.to)}
          >
            {({ isActive }) => (
              <button className={`sidebar-btn ${isActive ? "active" : ""}`} type="button">
                <span className="icon">{item.icon}</span>
                <span className="label">{item.label}</span>
              </button>
            )}
          </NavLink>
        ))}
        {user && (
          <button className="sidebar-btn" type="button" onClick={() => setShowConfirm(true)} aria-label="Sign Out">
            <span className="icon">{ICONS.signout}</span>
            <span className="label">Sign Out</span>
          </button>
        )}
      </div>

      <ConfirmSignOutModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmAndSignOut}
      />
    </aside>
  );
}
