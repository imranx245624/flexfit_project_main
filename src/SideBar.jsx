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
      <path d="M4 13h7v7H4v-7zm9-9h7v15h-7V4zM4 4h7v7H4V4z" fill="currentColor" />
    </svg>
  ),
  library: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6V3zm-2 4h2v14H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" fill="currentColor" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zm2 6h6v6H9v-6z" fill="currentColor" />
    </svg>
  ),
  ranking: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M4 20h4V10H4v10zm6 0h4V4h-4v16zm6 0h4v-7h-4v7z" fill="currentColor" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M19.4 13a7.7 7.7 0 0 0 .1-2l2-1.2-2-3.4-2.3.7a7 7 0 0 0-1.7-1l-.3-2.4H9l-.3 2.4a7 7 0 0 0-1.7 1l-2.3-.7-2 3.4 2 1.2a7.7 7.7 0 0 0 .1 2l-2 1.2 2 3.4 2.3-.7a7 7 0 0 0 1.7 1l.3 2.4h6.2l.3-2.4a7 7 0 0 0 1.7-1l2.3.7 2-3.4-2-1.2zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z" fill="currentColor" />
    </svg>
  ),
  signout: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M10 4h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7v-2h7V6h-7V4z" fill="currentColor" />
      <path d="M3 12l4-4v3h8v2H7v3l-4-4z" fill="currentColor" />
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
    { label: "Dashboard", to: "/progress", icon: ICONS.dashboard },
    { label: "Workout Library", to: "/workouts", icon: ICONS.library },
    { label: "AI Workout", to: "/AIWorkoutLibrary", icon: ICONS.ai },
    { label: "Flex Rankings", to: "/leaderboard", icon: ICONS.ranking },
  ]), []);

  const bottomItems = useMemo(() => ([
    { label: "Settings", to: "/settings", icon: ICONS.settings },
  ]), []);

  const handleSignOut = async () => {
    try {
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
