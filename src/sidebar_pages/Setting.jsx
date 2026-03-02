import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./settings.css";
import { toast } from "../utils/toast";

const SETTINGS_KEY = "ff-settings";

function readSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === "object") ? parsed : null;
  } catch (e) {
    return null;
  }
}

export default function Settings() {
  const [stored] = useState(() => readSettings());
  const [voiceFeedback, setVoiceFeedback] = useState(stored?.voiceFeedback ?? true);
  const [units, setUnits] = useState(stored?.units ?? "kg");
  const [difficulty, setDifficulty] = useState(stored?.difficulty ?? "standard");
  const [debugLogs, setDebugLogs] = useState(stored?.debugLogs ?? false);
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

  const handleSave = () => {
    const payload = {
      voiceFeedback,
      units,
      difficulty,
      debugLogs,
      theme,
    };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent("ff-settings-updated", { detail: payload }));
    } catch (e) {}
    toast("Settings saved.", { type: "success" });
  };

  return (
    <div className="settings-page container">
      <div className="settings-header">
        <div>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-sub">Personalize your FlexFit experience.</p>
        </div>
        <button className="btn-primary" type="button" onClick={handleSave}>
          Save Changes
        </button>
      </div>

      <div className="settings-groups">
        <div className="settings-group ff-card">
          <div className="settings-group-title">Preferences</div>
          <div className="settings-item">
            <div className="settings-label">Voice Feedback</div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={voiceFeedback}
                onChange={() => setVoiceFeedback(!voiceFeedback)}
                aria-label="Toggle voice feedback"
              />
              <span />
            </label>
          </div>

          <div className="settings-item">
            <div className="settings-label">Units</div>
            <div className="settings-options">
              <button
                className={`option ${units === "kg" ? "active" : ""}`}
                type="button"
                onClick={() => setUnits("kg")}
                aria-label="Use kilograms"
              >
                kg
              </button>
              <button
                className={`option ${units === "lbs" ? "active" : ""}`}
                type="button"
                onClick={() => setUnits("lbs")}
                aria-label="Use pounds"
              >
                lbs
              </button>
            </div>
          </div>

          <div className="settings-item">
            <div className="settings-label">Difficulty</div>
            <div className="settings-options">
              <button
                className={`option ${difficulty === "easy" ? "active" : ""}`}
                type="button"
                onClick={() => setDifficulty("easy")}
              >
                Easy
              </button>
              <button
                className={`option ${difficulty === "standard" ? "active" : ""}`}
                type="button"
                onClick={() => setDifficulty("standard")}
              >
                Standard
              </button>
              <button
                className={`option ${difficulty === "hard" ? "active" : ""}`}
                type="button"
                onClick={() => setDifficulty("hard")}
              >
                Hard
              </button>
            </div>
          </div>
        </div>

        <div className="settings-group ff-card">
          <div className="settings-group-title">Appearance</div>
          <div className="settings-item">
            <div className="settings-label">Theme</div>
            <div className="settings-options">
              <button
                className={`option ${theme === "light" ? "active" : ""}`}
                type="button"
                onClick={() => setTheme("light")}
              >
                Light
              </button>
              <button
                className={`option ${theme === "dark" ? "active" : ""}`}
                type="button"
                onClick={() => setTheme("dark")}
              >
                Dark
              </button>
            </div>
          </div>
          <div className="settings-help">Theme changes apply instantly across the app.</div>
          <Link className="settings-help-link" to="/help">Need help? Visit the Help page</Link>
        </div>

        <div className="settings-group ff-card">
          <div className="settings-group-title">Developer</div>
          <div className="settings-item">
            <div className="settings-label">Debug Logs</div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={debugLogs}
                onChange={() => setDebugLogs(!debugLogs)}
                aria-label="Toggle debug logs"
              />
              <span />
            </label>
          </div>
          <div className="settings-help">Enable verbose console logging for troubleshooting.</div>
        </div>
      </div>
    </div>
  );
}
