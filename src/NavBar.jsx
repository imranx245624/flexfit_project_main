// src/NavBar.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./nav.css";
import { useAuth } from "./utils/auth";
import SigninModal from "./components/SigninModal";
import { supabase } from "./utils/supabaseClient";
import { getExerciseBySlug } from "./data/exerciseCatalog";
import ConfirmSignOutModal from "./components/ConfirmSignOutModal.jsx";
import { clearSupabaseAuthStorage } from "./utils/supabaseAuthStorage";

export default function NavBar() {
  const { user } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("ff-theme");
    if (saved === "dark") return "dark";
    const attr = document.documentElement.getAttribute("data-theme");
    return attr === "dark" ? "dark" : "light";
  });
  const popoverRef = useRef(null);
  const loc = useLocation();
  const navigate = useNavigate();

  const PAGE_TITLES = {
    "/": "Home",
    "/workouts": "Workout Library",
    "/HWorkout": "Home Workout",
    "/GWorkout": "Gym Workout",
    "/AIWorkoutLibrary": "AI Workout Library",
    "/AIWorkout": "AI Workout",
    "/leaderboard": "Flex Rankings",
    "/plans": "Plans",
    "/profile": "Dashboard",
    "/progress": "MY Progress",
    "/settings": "Settings",
  };
  const pageTitle = (() => {
    if (loc.pathname.startsWith("/exercise/")) {
      const slug = loc.pathname.replace("/exercise/", "");
      const meta = getExerciseBySlug(slug);
      if (meta?.name) return meta.name;
      return slug
        .split("-")
        .map((word) => word ? word[0].toUpperCase() + word.slice(1) : "")
        .join(" ");
    }
    return PAGE_TITLES[loc.pathname] || "FlexFit";
  })();

  useEffect(() => {
    const handleClick = (e) => {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const handler = () => setShowSignIn(true);
    window.addEventListener("flexfit-open-signin", handler);
    return () => window.removeEventListener("flexfit-open-signin", handler);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      const attr = root.getAttribute("data-theme");
      setTheme(attr === "dark" ? "dark" : "light");
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    if (next === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    try { localStorage.setItem("ff-theme", next); } catch (e) {}
    setTheme(next);
  };

  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || (user?.email ? user.email.split("@")[0] : "User");
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      alert("Signed out");
    } catch (err) {
      console.error("Sign out error:", err);
      alert("Sign out failed: " + (err.message || err));
    } finally {
      clearSupabaseAuthStorage();
      setPopoverOpen(false);
      try { navigate("/", { replace: true }); } catch (e) {}
      try { window.location.replace("/"); } catch (e) {}
    }
  };

  const confirmAndSignOut = async () => {
    setShowConfirm(false);
    await handleSignOut();
  };

  return (
    <>
      <header className="navbar">
        <div className="nav-inner">
          <div className="nav-brand">FlexFit</div>
          <div className="nav-title">{pageTitle}</div>
          <div className="nav-right" ref={popoverRef}>
            <button
              className={`nav-theme-btn ${theme === "dark" ? "is-dark" : ""}`}
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              ☀
            </button>
            {user ? (
              <Link className="nav-btn nav-cta" to="/AIWorkoutLibrary">Train with AI</Link>
            ) : (
              <button
                className="nav-btn nav-cta"
                type="button"
                onClick={() => {
                  alert("Sign in first");
                  setShowSignIn(true);
                }}
              >
                Train with AI
              </button>
            )}
            {!user && (
              <button className="nav-btn" onClick={() => setShowSignIn(true)}>Sign in</button>
            )}

            {user && (
              <>
                <button
                  className="nav-avatar"
                  onClick={() => setPopoverOpen((v) => !v)}
                  aria-label="Profile menu"
                >
                  {avatarUrl ? <img src={avatarUrl} alt="avatar" /> : (displayName?.[0] || "U")}
                </button>

                {popoverOpen && (
                  <div className="profile-popover" role="dialog" aria-modal="false">
                    <button className="popover-close" onClick={() => setPopoverOpen(false)} aria-label="Close profile">&times;</button>
                    <div className="popover-content">
                      <div className="popover-avatar">
                        {avatarUrl ? <img src={avatarUrl} alt="avatar" /> : (displayName?.[0] || "U")}
                      </div>
                      <div className="popover-name">{displayName}</div>
                      <div className="popover-email">{user?.email || "No email"}</div>
                      <div className="popover-actions">
                        <Link to="/progress" className="popover-link" onClick={() => setPopoverOpen(false)}>Go to MY Progress</Link>
                        <Link to="/settings" className="popover-link" onClick={() => setPopoverOpen(false)}>Settings</Link>
                        <button
                          className="popover-link ghost"
                          type="button"
                          onClick={() => {
                            setPopoverOpen(false);
                            setShowConfirm(true);
                          }}
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <SigninModal open={showSignIn} onClose={() => setShowSignIn(false)} nonDismissible={false} />
      <ConfirmSignOutModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmAndSignOut}
      />
    </>
  );
}
