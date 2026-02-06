// src/components/TopNav.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./TopNav.css";

const PAGE_TITLES = {
  "/": "Home",
  "/workouts": "Workout Library",
  "/HWorkout": "Home Workouts",
  "/GWorkout": "Gym Workouts",
  "/AIWorkout": "AI Workout",
  "/progress": "Progress Tracker",
  "/leaderboard": "Flex Rankings",
  "/settings": "Settings",
};

export default function TopNav({ currentUser, setShowProfile, setShowSignIn }) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const handler = (e) => {
      const hide = Boolean(e?.detail);
      setHidden(hide);
      setOpen(false);
    };
    window.addEventListener("flexfit-hide-shell", handler);
    return () => window.removeEventListener("flexfit-hide-shell", handler);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  const pageTitle = PAGE_TITLES[loc.pathname] || "FlexFit";
  const userInitial = (currentUser?.user_metadata?.full_name || currentUser?.email || "U")[0].toUpperCase();

  return (
    <header className={`topnav ${hidden ? "is-hidden" : ""}`}>
      <div className="topnav-inner container">
        <div className="topnav-left">
          <button
            className="nav-toggle"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="topnav-menu"
            onClick={() => setOpen(!open)}
          >
            <span />
            <span />
            <span />
          </button>
          <Link to="/" className="brand">FLEXFIT</Link>
          <nav className="topnav-links">
            <Link to="/workouts" className={loc.pathname === "/workouts" ? "active" : ""}>Workouts</Link>
            <Link to="/HWorkout" className={loc.pathname === "/HWorkout" ? "active" : ""}>AI Workout</Link>
            <Link to="/progress" className={loc.pathname === "/progress" ? "active" : ""}>Progress</Link>
            <Link to="/leaderboard" className={loc.pathname === "/leaderboard" ? "active" : ""}>Rankings</Link>
            <Link to="/settings" className={loc.pathname === "/settings" ? "active" : ""}>Settings</Link>
          </nav>
        </div>

        <div className="topnav-center">
          <div className="page-title mono">{pageTitle}</div>
        </div>

        <div className="topnav-right">
          <Link to="/HWorkout" className="btn topnav-cta">Train with AI</Link>

          <button className="nav-icon ghost" aria-label="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </button>

          {currentUser ? (
            <button
              className="avatar-btn"
              aria-label="Profile"
              onClick={() => setShowProfile(true)}
            >
              {userInitial}
            </button>
          ) : (
            <button className="btn ghost small" onClick={() => setShowSignIn(true)}>Sign in</button>
          )}
        </div>
      </div>

      <div id="topnav-menu" className={`topnav-mobile ${open ? "open" : ""}`}>
        <Link to="/" onClick={() => setOpen(false)}>Home</Link>
        <Link to="/workouts" onClick={() => setOpen(false)}>Workout Library</Link>
        <Link to="/HWorkout" onClick={() => setOpen(false)}>AI Workout</Link>
        <Link to="/progress" onClick={() => setOpen(false)}>Progress Tracker</Link>
        <Link to="/leaderboard" onClick={() => setOpen(false)}>Flex Rankings</Link>
        <Link to="/settings" onClick={() => setOpen(false)}>Settings</Link>
        <Link to="/HWorkout" onClick={() => setOpen(false)} className="mobile-cta">Train with AI</Link>
      </div>
    </header>
  );
}
