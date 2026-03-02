import React from "react";
import { Link } from "react-router-dom";
import PageWrapper from "../workout_pages/pageWrapper.jsx";
import "./plans.css";

const PLANS = [
  {
    title: "Home Starter",
    icon: "Home",
    desc: "Bodyweight routines with beginner-friendly progressions.",
    meta: "3 days/week",
    link: "/workouts?type=home",
    cta: "Start Home",
  },
  {
    title: "Gym Strength",
    icon: "Gym",
    alt: true,
    desc: "Machine + free-weight sessions for strength gains.",
    meta: "4 days/week",
    link: "/workouts?type=gym",
    cta: "Start Gym",
  },
  {
    title: "AI Guided",
    icon: "AI",
    desc: "Real-time form feedback with pose detection and rep counting.",
    meta: "Full body tracking",
    link: "/AIWorkoutLibrary",
    cta: "Train with AI",
  },
  {
    title: "Hybrid Builder",
    icon: "Mix",
    alt: true,
    desc: "Combine home and gym days for a balanced weekly plan.",
    meta: "Custom schedule",
    link: "/workouts",
    cta: "Build Plan",
  },
];

function Plans() {
  return (
    <PageWrapper>
      <div className="plans-page container">
        <div className="plans-header">
          <h1 className="plans-title">Training Plans</h1>
          <p className="plans-sub">Pick a plan and start training today.</p>
        </div>

        <div className="plans-grid">
          {PLANS.map((plan) => (
            <div key={plan.title} className="plans-card glow-hover">
              <div className={`plans-icon ${plan.alt ? "alt" : ""}`}>{plan.icon}</div>
              <div className="plans-name">{plan.title}</div>
              <div className="plans-desc">{plan.desc}</div>
              <div className="plans-meta">{plan.meta}</div>
              <Link to={plan.link} className="btn">{plan.cta}</Link>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}

export default Plans;
