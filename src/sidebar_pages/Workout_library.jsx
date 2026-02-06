import React, { useState } from "react";
import { Link } from "react-router-dom";
import PageWrapper from "../workout_pages/pageWrapper.jsx";
import "./workoutLibrary.css";

import video1 from "../assets/videos/video1.mp4";
import video2 from "../assets/videos/video2.mp4";
import video3 from "../assets/videos/video3.mp4";
import video4 from "../assets/videos/video4.mp4";

import chest1 from "../assets/Gym_videos/chest1.mp4";
import back1 from "../assets/Gym_videos/back1.mp4";
import shoulder1 from "../assets/Gym_videos/shoulder1.mp4";
import legs1 from "../assets/Gym_videos/legs1.mp4";

const HOME_WORKOUTS = [
  { title: "Planks", level: "Beginner", duration: "6-10 min", video: video1 },
  { title: "Push Ups", level: "Intermediate", duration: "10-18 min", video: video2 },
  { title: "Squats", level: "Beginner", duration: "12-20 min", video: video3 },
  { title: "Burpees", level: "Advanced", duration: "8-15 min", video: video4 },
];

const GYM_WORKOUTS = [
  { title: "Dumbbell Bench Press", level: "Intermediate", duration: "15-25 min", video: chest1 },
  { title: "Seated Cable Row", level: "Intermediate", duration: "15-20 min", video: back1 },
  { title: "Face Pulls", level: "Beginner", duration: "12-18 min", video: shoulder1 },
  { title: "Leg Extension", level: "Beginner", duration: "12-20 min", video: legs1 },
];

export default function Workouts() {
  const [preview, setPreview] = useState(null);

  return (
    <PageWrapper>
      <div className="library-page container">
        <div className="library-header">
          <div>
            <h1 className="library-title">Workout Library</h1>
            <p className="library-sub">
              Preview a routine before starting. Use Train with AI to launch a session.
            </p>
          </div>
          <Link to="/HWorkout" className="btn">Train with AI</Link>
        </div>

        <section className="library-section">
          <div className="section-title-row">
            <h2>Home Workouts</h2>
            <span>No equipment required</span>
          </div>
          <div className="library-grid">
            {HOME_WORKOUTS.map((w) => (
              <div key={w.title} className="library-card glow-hover">
                <div className="library-thumb" />
                <div className="library-info">
                  <div className="library-name">{w.title}</div>
                  <div className="library-meta">{w.level} - {w.duration}</div>
                  <div className="library-actions">
                    <button className="btn ghost small" onClick={() => setPreview(w)}>Preview video</button>
                    <span className="library-tag">Practice</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="library-section">
          <div className="section-title-row">
            <h2>Gym Workouts</h2>
            <span>Best with equipment access</span>
          </div>
          <div className="library-grid">
            {GYM_WORKOUTS.map((w) => (
              <div key={w.title} className="library-card glow-hover">
                <div className="library-thumb alt" />
                <div className="library-info">
                  <div className="library-name">{w.title}</div>
                  <div className="library-meta">{w.level} - {w.duration}</div>
                  <div className="library-actions">
                    <button className="btn ghost small" onClick={() => setPreview(w)}>Preview video</button>
                    <span className="library-tag">Practice</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {preview && (
        <div className="preview-backdrop" role="dialog" aria-modal="true" aria-label="Workout preview">
          <div className="preview-modal">
            <div className="preview-header">
              <div>
                <div className="preview-title">{preview.title}</div>
                <div className="preview-meta">{preview.level} - {preview.duration}</div>
              </div>
              <button className="preview-close" onClick={() => setPreview(null)} aria-label="Close preview">Close</button>
            </div>
            <video className="preview-video" src={preview.video} controls autoPlay muted />
            <div className="preview-note">Use Train with AI to start a tracked session.</div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
