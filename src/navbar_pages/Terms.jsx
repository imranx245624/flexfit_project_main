import React from "react";
import { Link } from "react-router-dom";
import "./legal.css";

export default function Terms() {
  return (
    <div className="legal-page container">
      <div className="ff-card legal-card">
        <h1 className="legal-title">Terms of Service</h1>
        <p className="legal-sub">Last updated: February 27, 2026</p>

        <div className="legal-section">
          <h3>Use of the service</h3>
          <p>
            FlexFit is provided for informational and fitness guidance purposes only.
            Always exercise within your limits and consult a professional for medical advice.
          </p>
        </div>

        <div className="legal-section">
          <h3>Account responsibility</h3>
          <p>
            You are responsible for maintaining the confidentiality of your account and activity.
          </p>
        </div>

        <div className="legal-section">
          <h3>Acceptable use</h3>
          <p>
            Do not attempt to misuse, disrupt, or reverse engineer the service.
          </p>
        </div>

        <div className="legal-section">
          <h3>Support</h3>
          <p>
            For questions, visit the <Link to="/help">Help</Link> page.
          </p>
        </div>
      </div>
    </div>
  );
}
