// src/workout_pages/AIWorkoutLibrary.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import PageWrapper from "./pageWrapper.jsx";
import "./aiWorkout.css";

import video1 from "../assets/videos/video1.mp4";
import video2 from "../assets/videos/video2.mp4";
import video3 from "../assets/videos/video3.mp4";
import video4 from "../assets/videos/video4.mp4";
import jumpingJacks from "../assets/videos/jumping jacks.mp4";
import legRaises from "../assets/videos/leg raises.mp4";
import sumoSquat from "../assets/videos/Sumo Squat.mp4";

const AI_WORKOUTS = [
  { title: "Push Ups", level: "Intermediate", duration: "10-20 min", video: video2, tracking: "full" },
  { title: "Squats", level: "Beginner", duration: "12-20 min", video: video3, tracking: "full" },
  { title: "Planks", level: "Beginner", duration: "3-8 min", video: video1, tracking: "full" },
  { title: "Lunges", level: "Beginner", duration: "10-18 min", video: video2, tracking: "full" },
  { title: "Burpees", level: "Advanced", duration: "8-15 min", video: video4, tracking: "full" },
  { title: "Jumping Jacks", level: "Beginner", duration: "6-12 min", video: jumpingJacks, tracking: "full" },
  { title: "Sumo Squat", level: "Beginner", duration: "10-18 min", video: sumoSquat, tracking: "full" },
  { title: "Pull Ups", level: "Advanced", duration: "6-15 min", video: video3, tracking: "partial" },
  { title: "Crunches", level: "Beginner", duration: "6-12 min", video: video1, tracking: "partial" },
  { title: "Leg Raises", level: "Beginner", duration: "6-12 min", video: legRaises, tracking: "partial" },
];

export default function AIWorkoutLibrary() {
  const navigate = useNavigate();

  const startWorkout = (name) => {
    navigate("/AIWorkout", {
      state: {
        workoutName: name,
        returnTo: "/AIWorkoutLibrary",
        origin: "ai",
      },
    });
  };

  const fullTracking = AI_WORKOUTS.filter((w) => w.tracking === "full");
  const partialTracking = AI_WORKOUTS.filter((w) => w.tracking === "partial");

  const renderGrid = (items) => (
    <div className="ai-catalog-grid">
      {items.map((w) => (
        <div key={w.title} className="ai-catalog-card">
          <button
            type="button"
            className="ai-catalog-video"
            onClick={() => startWorkout(w.title)}
            aria-label={`Start ${w.title}`}
          >
            <video
              src={w.video}
              autoPlay
              muted
              loop
              playsInline
            />
            <span className="ai-catalog-play">Preview</span>
          </button>
          <div className="ai-catalog-body">
            <div className="ai-catalog-name">
              {w.title}
              <div className="small-muted">{w.level} - {w.duration}</div>
            </div>
            <button
              type="button"
              className="ai-catalog-train"
              onClick={() => startWorkout(w.title)}
            >
              Start
            </button>
          </div>
        </div>
      ))}
      {!items.length && (
        <div className="ai-catalog-empty">No workouts available.</div>
      )}
    </div>
  );

  return (
    <PageWrapper>
      <div className="ai-catalog">
        <div className="ai-catalog-header">
          <div>
            <div className="ai-catalog-kicker">FlexFit AI</div>
            <h1 className="ai-catalog-title">AI Workout Library</h1>
            <p className="ai-catalog-sub">Choose a workout and tap Start to begin pose detection.</p>
          </div>
          <div className="ai-catalog-legend">
            <span className="legend-pill good">Full Tracking</span>
            <span className="legend-pill partial">Partial Tracking</span>
          </div>
        </div>

        <section className="ai-catalog-section">
          <div className="ai-catalog-section-head">
            <h2>AI Workouts</h2>
            <p>Best results when your full body is visible</p>
          </div>

          <div className="ai-catalog-subhead good">Full Tracking</div>
          {renderGrid(fullTracking)}

          <div className="ai-catalog-subhead partial">Partial Tracking</div>
          {renderGrid(partialTracking)}
        </section>
      </div>
    </PageWrapper>
  );
}
