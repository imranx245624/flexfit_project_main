import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./settings.css";

export default function Settings() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("ff-theme");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    try { localStorage.setItem("ff-theme", theme); } catch (e) {}
  }, [theme]);

  return (
    <div className="settings-page container">
      <div className="settings-header">
        <div>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-sub">Appearance settings for FlexFit.</p>
        </div>
      </div>

      <div className="settings-groups single">
        <div className="settings-group ff-card">
          <div className="settings-group-title">Appearance</div>
          <div className="settings-item">
            <div className="settings-label">Theme</div>
            <div className="settings-options">
              <button
                className={`option ${theme === "light" ? "active" : ""}`}
                onClick={() => setTheme("light")}
              >
                Light
              </button>
              <button
                className={`option ${theme === "dark" ? "active" : ""}`}
                onClick={() => setTheme("dark")}
              >
                Dark
              </button>
            </div>
          </div>
          <div className="settings-help">Theme changes apply instantly across the app.</div>
          <Link className="settings-help-link" to="/help">Need help? Visit the Help page</Link>
        </div>
      </div>
    </div>
  );
}
