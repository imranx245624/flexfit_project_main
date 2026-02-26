import React from "react";
import { Link } from "react-router-dom";
import PageWrapper from "../workout_pages/pageWrapper.jsx";
import "./plans.css";

function Plans() {
  return (
    <PageWrapper>
      <div className="plans-page container">
        <div className="plans-header">
          <h1 className="plans-title">Select Workout Mode</h1>
          <p className="plans-sub">Choose where you want to train today.</p>
        </div>

        <div className="plans-grid">
          <div className="plans-card glow-hover">
            <div className="plans-icon">Home</div>
            <div className="plans-name">Home Workout</div>
            <div className="plans-desc">Train at home with minimal equipment.</div>
            <Link to="/workouts?type=home" className="btn">Start Home</Link>
          </div>

          <div className="plans-card glow-hover">
            <div className="plans-icon alt">Gym</div>
            <div className="plans-name">Gym Workout</div>
            <div className="plans-desc">Access equipment for higher intensity sessions.</div>
            <Link to="/workouts?type=gym" className="btn">Start Gym</Link>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default Plans;
