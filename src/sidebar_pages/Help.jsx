import React from "react";
import { Link } from "react-router-dom";
import "./help.css";

export default function Help() {
  return (
    <div className="help-page container">
      <section className="help-hero">
        <div className="help-hero-text">
          <span className="help-kicker">FlexFit Support</span>
          <h1 className="help-title">Help & Support</h1>
          <p className="help-sub">
            Official help center for FlexFit. Find setup guidance, workout tips, and account support in one place.
          </p>
          <div className="help-search">
            <input
              type="search"
              placeholder="Search help topics (coming soon)"
              aria-label="Search help topics"
              disabled
            />
          </div>
          {/* <div className="help-actions">
            <Link to="/AIWorkoutLibrary" className="btn-primary">Train with AI</Link>
            <Link to="/workouts" className="btn-ghost">Workout Library</Link>
          </div> */}
        </div>
        <div className="help-hero-card">
          <div className="help-hero-card-title">Contact Support</div>
          <div className="help-hero-item">
            Email:{" "}
            <a className="help-link" href="mailto:flexfit@gmail.com" aria-label="Email FlexFit support">
              flexfit@gmail.com
            </a>
          </div>
          <div className="help-hero-item">Typical response: 24-48 hours</div>
          <div className="help-hero-item">Include your device + browser in the message</div>
        </div>
      </section>

      <section className="help-section">
        <div className="help-section-title">Popular Topics</div>
        <div className="help-grid">
          <div className="help-card">
            <div className="help-card-title">Getting Started</div>
            <div className="help-item">Sign in once to keep your progress and rankings synced.</div>
            <div className="help-item">Open AI Workout Library and select a workout.</div>
            <div className="help-item">Allow camera access and begin.</div>
          </div>

          <div className="help-card">
            <div className="help-card-title">AI Workout</div>
            <div className="help-item">Stand where your full body is visible.</div>
            <div className="help-item">Follow on-screen cues for posture and tempo.</div>
            <div className="help-item">Use Stop Workout to save the session.</div>
          </div>

          <div className="help-card">
            <div className="help-card-title">Flex Rankings</div>
            <div className="help-item">Leaderboard refreshes weekly (Sun-Sat).</div>
            <div className="help-item">Flex Points are based on reps/time, MET, and your weight.</div>
          </div>

          <div className="help-card">
            <div className="help-card-title">Account & Profile</div>
            <div className="help-item">Update profile details in Dashboard.</div>
            <div className="help-item">Progress view shows saved sessions and best scores.</div>
          </div>

          <div className="help-card">
            <div className="help-card-title">Troubleshooting</div>
            <div className="help-item">Camera blocked: use HTTPS or allow permission.</div>
            <div className="help-item">No video preview: check connection and retry.</div>
            <div className="help-item">Sign-in issues: sign out and sign in again.</div>
          </div>

          <div className="help-card">
            <div className="help-card-title">Privacy & Safety</div>
            <div className="help-item">Camera feed stays on device; only stats are saved.</div>
            <div className="help-item">Stop immediately if you feel pain or discomfort.</div>
          </div>
        </div>
      </section>

      <section className="help-section help-contact">
        <div className="help-section-title">Need More Help?</div>
        <div className="help-contact-note">
          Reach out to our support team at{" "}
          <a className="help-link" href="mailto:flexfit@gmail.com" aria-label="Email FlexFit support">
            flexfit@gmail.com
          </a>
          .
        </div>
      </section>
    </div>
  );
}
