// src/NavBar.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./nav.css";
import { useAuth } from "./utils/auth";
import SigninModal from "./components/SigninModal";
import { getExerciseBySlug } from "./data/exerciseCatalog";
import ConfirmSignOutModal from "./components/ConfirmSignOutModal.jsx";
import { forceSignOut } from "./utils/forceSignOut";
import { toast } from "./utils/toast";

export default function NavBar() {
  const { user } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [pendingInstallHint, setPendingInstallHint] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("ff-theme");
    if (saved === "dark") return "dark";
    const attr = document.documentElement.getAttribute("data-theme");
    return attr === "dark" ? "dark" : "light";
  });
  const popoverRef = useRef(null);
  const installDelayRef = useRef(null);
  const isInstalledRef = useRef(false);
  const loc = useLocation();
  const navigate = useNavigate();

  const PAGE_TITLES = {
    "/": "Home",
    "/workouts": "Workout Library",
    "/HWorkout": "Workout Library",
    "/GWorkout": "Workout Library",
    "/AIWorkoutLibrary": "AI Workout Library",
    "/AIWorkout": "AI Workout",
    "/leaderboard": "Flex Rankings",
    "/plans": "Plans",
    "/profile": "Dashboard",
    "/progress": "MY Progress",
    "/settings": "Settings",
    "/help": "Help",
    "/privacy": "Privacy Policy",
    "/terms": "Terms",
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

  useEffect(() => {
    isInstalledRef.current = isInstalled;
  }, [isInstalled]);

  useEffect(() => {
    const checkInstalled = () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches;
      const iOSStandalone = window.navigator.standalone === true;
      setIsInstalled(standalone || iOSStandalone);
    };
    const syncFromWindow = () => {
      const existing = window.__ffInstallPrompt || null;
      if (existing) {
        setInstallPrompt(existing);
        setCanInstall(true);
      }
    };
    checkInstalled();
    syncFromWindow();

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setCanInstall(true);
      try {
        window.__ffInstallPrompt = e;
        window.dispatchEvent(new CustomEvent("flexfit-install-available"));
      } catch (err) {}
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setCanInstall(false);
      setIsInstalled(true);
      setShowInstallModal(false);
    };
    const handleInstallHint = () => {
      if (isInstalledRef.current) return;
      try {
        if (localStorage.getItem("ff-install-hint-seen") === "1") return;
      } catch (e) {}
      setPendingInstallHint(true);
    };
    const handleInstallUsed = () => {
      setInstallPrompt(null);
      setCanInstall(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("flexfit-install-hint", handleInstallHint);
    window.addEventListener("flexfit-install-available", syncFromWindow);
    window.addEventListener("flexfit-install-used", handleInstallUsed);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("flexfit-install-hint", handleInstallHint);
      window.removeEventListener("flexfit-install-available", syncFromWindow);
      window.removeEventListener("flexfit-install-used", handleInstallUsed);
    };
  }, []);

  useEffect(() => {
    if (!pendingInstallHint) return;
    if (!canInstall || isInstalled) return;
    try {
      if (localStorage.getItem("ff-install-hint-seen") === "1") return;
    } catch (e) {}
    if (installDelayRef.current) {
      clearTimeout(installDelayRef.current);
    }
    installDelayRef.current = setTimeout(() => {
      setShowInstallModal(true);
      setPendingInstallHint(false);
      try { localStorage.setItem("ff-install-hint-seen", "1"); } catch (e) {}
    }, 1800);
    return () => {
      if (installDelayRef.current) clearTimeout(installDelayRef.current);
    };
  }, [pendingInstallHint, canInstall, isInstalled]);

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

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    try {
      const choice = await installPrompt.userChoice;
      if (choice?.outcome === "accepted") {
        setIsInstalled(true);
      }
    } catch (e) {}
    setCanInstall(false);
    setInstallPrompt(null);
    setShowInstallModal(false);
    try { localStorage.setItem("ff-install-hint-seen", "1"); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent("flexfit-install-used")); } catch (e) {}
  };

  const handleInstallLater = () => {
    setShowInstallModal(false);
    try { localStorage.setItem("ff-install-hint-seen", "1"); } catch (e) {}
  };

  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || (user?.email ? user.email.split("@")[0] : "User");
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  const handleSignOut = async () => {
    try {
      try { sessionStorage.setItem("ff-manual-signout", "1"); } catch (e) {}
      const error = await forceSignOut();
      if (error) {
        console.error("Sign out error:", error);
        toast("Signed out locally.", { type: "info" });
      } else {
        toast("Signed out", { type: "success" });
      }
    } catch (err) {
      console.error("Sign out error:", err);
      toast("Sign out failed: " + (err.message || err), { type: "error" });
    } finally {
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
              {"\u2600"}
            </button>
            <Link className="nav-help-btn" to="/help" aria-label="Help" title="Help">
              ?
            </Link>
            {canInstall && !isInstalled && (
              <button
                className="nav-btn nav-install"
                type="button"
                onClick={handleInstallClick}
                aria-label="Install app"
                title="Install app"
              >
                Install App
              </button>
            )}
            {/* {user ? (
              <Link className="nav-btn nav-cta" to="/AIWorkoutLibrary">Train with AI</Link>
            ) : (
              <button
                className="nav-btn nav-cta"
                type="button"
                onClick={() => {
                  toast("Please sign in to continue.", { type: "info" });
                  setShowSignIn(true);
                }}
              >
                Train with AI
              </button>
            )} */}
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
                        <Link to="/profile" className="popover-link" onClick={() => setPopoverOpen(false)}>Go to Dashboard</Link>
                        <Link to="/help" className="popover-link ghost" onClick={() => setPopoverOpen(false)}>Help & Support</Link>
                        {/* <Link to="/settings" className="popover-link" onClick={() => setPopoverOpen(false)}>Settings</Link> */}
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

      {showInstallModal && (
        <div className="install-modal-backdrop" role="dialog" aria-modal="true">
          <div className="install-modal">
            <div className="install-modal-title">Install FlexFit</div>
            <div className="install-modal-sub">Get the app for faster access and offline support.</div>
            <div className="install-modal-actions">
              <button className="btn ghost" type="button" onClick={handleInstallLater}>Not now</button>
              <button className="btn nav-install" type="button" onClick={handleInstallClick}>Install</button>
            </div>
          </div>
        </div>
      )}

      <SigninModal open={showSignIn} onClose={() => setShowSignIn(false)} nonDismissible={false} />
      <ConfirmSignOutModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmAndSignOut}
      />
    </>
  );
}
