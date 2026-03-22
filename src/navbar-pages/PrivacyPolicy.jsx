import React from "react";
import { Link } from "react-router-dom";
import "./legal.css";

export default function PrivacyPolicy() {
  return (
    <div className="legal-page container">
      <div className="ff-card legal-card">
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-sub">Last updated: February 27, 2026</p>

        <div className="legal-section">
          <h3>What we collect</h3>
          <p>
            FlexFit stores your account profile (email, name, avatar) and workout session summaries
            (reps, time, flex points, calories, and timestamps). We do not store raw camera video.
          </p>
        </div>

        <div className="legal-section">
          <h3>How we use data</h3>
          <p>
            Data is used to personalize your dashboard, progress tracking, and leaderboards.
            We do not sell personal information.
          </p>
        </div>

        <div className="legal-section">
          <h3>Camera and device processing</h3>
          <p>
            Pose detection runs on-device in your browser. Only aggregated workout stats are saved.
          </p>
        </div>

        <div className="legal-section">
          <h3>Contact</h3>
          <p>
            Questions? Visit the <Link to="/help">Help</Link> page.
          </p>
        </div>
      </div>
    </div>
  );
}
