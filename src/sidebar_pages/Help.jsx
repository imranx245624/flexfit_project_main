import React from "react";
import { Link } from "react-router-dom";
import "./help.css";

export default function Help() {
  return (
    <div className="help-page container">
      <div className="help-hero">
        <div className="help-hero-text">
          <span className="help-kicker">FlexFit Support</span>
          <h1 className="help-title">Help & Quick Guide</h1>
          <p className="help-sub">
            Everything you need to use FlexFit confidently: workout flow, camera tips,
            flex points, and common fixes.
          </p>
          <div className="help-actions">
            <Link to="/AIWorkoutLibrary" className="btn-primary">Train with AI</Link>
            <Link to="/workouts" className="btn-ghost">Workout Library</Link>
          </div>
        </div>
        <div className="help-hero-card">
          <div className="help-hero-card-title">Quick Tips</div>
          <div className="help-hero-item">Use good lighting and keep your full body visible.</div>
          <div className="help-hero-item">Allow camera permission (HTTPS)</div>
          <div className="help-hero-item">Save only after at least 1 rep.</div>
          <div className="help-hero-item">Flex Rankings reset weekly (Sun-Sat)</div>
        </div>
      </div>

      <div className="help-grid">
        <div className="help-card">
          <div className="help-card-title">Project Overview</div>
          <div className="help-item">FlexFit is an AI workout assistant with pose detection and live feedback.</div>
          <div className="help-item">Sessions store reps, time, weight, and flex points for progress tracking.</div>
        </div>

        <div className="help-card">
          <div className="help-card-title">Getting Started</div>
          <div className="help-item">Sign in once to keep your progress and dashboard synced.</div>
          <div className="help-item">Go to AI Workout Library and choose a workout.</div>
          <div className="help-item">Click Start, allow camera access, and begin reps.</div>
        </div>

        <div className="help-card">
          <div className="help-card-title">AI Workout Flow</div>
          <div className="help-item">Stand where your full body is visible in frame.</div>
          <div className="help-item">Follow on-screen cues for posture and timing.</div>
          <div className="help-item">Use Stop Workout to open the save dialog.</div>
        </div>

        <div className="help-card">
          <div className="help-card-title">Flex Points & Rankings</div>
          <div className="help-item">Flex Points are based on reps/time, MET, and your weight.</div>
          <div className="help-item">Rankings show average Flex Points per active day (Sun-Sat).</div>
        </div>

        <div className="help-card">
          <div className="help-card-title">Progress & Dashboard</div>
          <div className="help-item">Check MY Progress for sessions, calories, and flex points.</div>
          <div className="help-item">Dashboard shows weekly activity and best flex points.</div>
        </div>

        <div className="help-card">
          <div className="help-card-title">Troubleshooting</div>
          <div className="help-item">Camera error: use HTTPS or allow permission in the browser.</div>
          <div className="help-item">if data after reload: sign in again because your session expired</div>
          <div className="help-item">Video previews missing: check internet or try again later.</div>
        </div>

        <div className="help-card">
          <div className="help-card-title">Privacy & Safety</div>
          <div className="help-item">Camera feed stays on device; only workout stats are saved.</div>
          <div className="help-item">Stop if you feel pain or lose form.</div>
        </div>
      </div>
    </div>
  );
}
