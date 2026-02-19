import React, { useState } from "react";
import "./settings.css";

export default function Settings() {
  const [voiceFeedback, setVoiceFeedback] = useState(true);
  const [units, setUnits] = useState("kg");
  const [difficulty, setDifficulty] = useState("standard");
  const [debugLogs, setDebugLogs] = useState(false);

  const handleSave = () => {
    // TODO: Hook to existing settings save handlers without changing API calls.
  };

  return (
    <div className="settings-page container">
      <div className="settings-header">
        <div>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-sub">Personalize your FlexFit experience.</p>
        </div>
        <button className="btn-primary" onClick={handleSave}>Save Changes</button>
      </div>

      <div className="settings-groups">
        <div className="settings-group ff-card">
          <div className="settings-group-title">Account</div>
          <div className="settings-item">
            <div className="settings-label">Username</div>
            <div className="settings-value small-muted">Set in profile</div>
          </div>
          <div className="settings-item">
            <div className="settings-label">Email</div>
            <div className="settings-value small-muted">Linked to sign-in</div>
          </div>
        </div>

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
                onClick={() => setUnits("kg")}
                aria-label="Use kilograms"
              >
                kg
              </button>
              <button
                className={`option ${units === "lbs" ? "active" : ""}`}
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
                onClick={() => setDifficulty("easy")}
              >
                Easy
              </button>
              <button
                className={`option ${difficulty === "standard" ? "active" : ""}`}
                onClick={() => setDifficulty("standard")}
              >
                Standard
              </button>
              <button
                className={`option ${difficulty === "hard" ? "active" : ""}`}
                onClick={() => setDifficulty("hard")}
              >
                Hard
              </button>
            </div>
          </div>
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
