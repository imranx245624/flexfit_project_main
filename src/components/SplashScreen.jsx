import React from "react";
import "./SplashScreen.css";

export default function SplashScreen({ exiting = false }) {
  return (
    <div className={`ff-splash ${exiting ? "is-exiting" : ""}`} role="presentation" aria-hidden="true">
      <div className="ff-splash-noise" aria-hidden="true" />
      <div className="ff-splash-content">
        <div className="ff-splash-logo-wrap">
          <img className="ff-splash-logo" src="/flexfit.png" alt="FlexFit logo" />
          <div className="ff-splash-ring" aria-hidden="true" />
        </div>
        <div className="ff-splash-title">FlexFit</div>
        <div className="ff-splash-sub">Train smarter with AI guidance</div>
      </div>
      <div className="ff-splash-sheen" aria-hidden="true" />
    </div>
  );
}
