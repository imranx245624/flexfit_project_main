import React, { useState } from "react";
import "./settings.css";

export default function Settings() {
  const [voiceFeedback, setVoiceFeedback] = useState(true);
  const [units, setUnits] = useState("kg");

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
        <button className="btn" onClick={handleSave}>Save Changes</button>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
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
          <div className="settings-help">Enable spoken cues during AI workouts.</div>
        </div>

        <div className="settings-card">
          <div className="settings-label">Units</div>
          <div className="settings-options">
            <button
              className={`option ${units === "kg" ? "active" : ""}`}
              onClick={() => setUnits("kg")}
            >
              kg
            </button>
            <button
              className={`option ${units === "lbs" ? "active" : ""}`}
              onClick={() => setUnits("lbs")}
            >
              lbs
            </button>
          </div>
          <div className="settings-help">Choose how weight values are displayed.</div>
        </div>

        <div className="settings-card">
          <div className="settings-label">Session Reminders</div>
          <label className="toggle">
            <input type="checkbox" defaultChecked aria-label="Toggle reminders" />
            <span />
          </label>
          <div className="settings-help">Get a nudge when you skip a day.</div>
        </div>
      </div>
    </div>
  );
}
