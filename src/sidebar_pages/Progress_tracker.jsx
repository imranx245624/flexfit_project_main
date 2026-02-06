import React from "react";
import "./progressTracker.css";

const DEFAULT_PROGRESS = {
  totalSessions: 0,
  avgAccuracy: 0,
  totalEca: 0,
  sessions: [],
};

function Progress() {
  // TODO: Hook into existing progress endpoints without changing API calls.
  const progress = DEFAULT_PROGRESS;

  return (
    <div className="progress-page container">
      <div className="progress-header">
        <div>
          <h1 className="progress-title">Progress Tracker</h1>
          <p className="progress-sub">Track accuracy, consistency, and ECA points over time.</p>
        </div>
        <button className="btn ghost small">Export</button>
      </div>

      <div className="progress-chart">
        <div className="chart-overlay">
          <div className="chart-label">Weekly Form Trend (placeholder)</div>
          <div className="chart-line" />
        </div>
      </div>

      <div className="progress-summary">
        <div className="summary-card">
          <div className="summary-label">Total Sessions</div>
          <div className="summary-value">{progress.totalSessions}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Avg Accuracy</div>
          <div className="summary-value">{progress.avgAccuracy || "--"}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total ECA</div>
          <div className="summary-value">{progress.totalEca}</div>
        </div>
      </div>

      <div className="progress-empty">
        No sessions yet - start your first AI workout!
      </div>
    </div>
  );
}

export default Progress;
