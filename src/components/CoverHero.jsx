import React from "react";
import { Link } from "react-router-dom";
import "./CoverHero.css";

export default function CoverHero() {
  return (
    <section className="ff-hero" aria-labelledby="ff-hero-title">
      {/* Background Video */}
      <video
        className="ff-hero-video"
        src="/assets/workouts/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      {/* Dark overlay for readability */}
      <div className="ff-hero-overlay" />

      {/* Content */}
      <div className="ff-hero-inner container">
        <div className="ff-hero-left">
          <h1 id="ff-hero-title">Welcome to FlexFit</h1>

          <p className="sub">
            Your AI-powered fitness companion — live posture correction,
            personalized sessions, progress reports.
          </p>

          <div className="ff-hero-cta">
            <Link to="/HWorkout" className="btn-primary">
              Home Workout
            </Link>

            <Link to="/workouts" className="btn-ghost">
              Workout library
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
