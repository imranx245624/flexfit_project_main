// src/pages/GymWorkout.jsx
import PageWrapper from "./pageWrapper.jsx";
import React from "react";

import VideoCard from "../components/VideoCard.jsx";
import "./workout.css";

import chest1 from "../assets/Gym_videos/chest1.mp4";
import chest2 from "../assets/Gym_videos/chest2.mp4";
import back1 from "../assets/Gym_videos/back1.mp4";
import back2 from "../assets/Gym_videos/back2.mp4";
import back3 from "../assets/Gym_videos/back3.mp4";
import shoulder1 from "../assets/Gym_videos/shoulder1.mp4";
import shoulder2 from "../assets/Gym_videos/shoulder2.mp4";
import shoulder3 from "../assets/Gym_videos/shoulder3.mp4";
import bicep1 from "../assets/Gym_videos/bicep1.mp4";
import bicep2 from "../assets/Gym_videos/bicep2.mp4";
import tricep1 from "../assets/Gym_videos/tricep1.mp4";
import legs1 from "../assets/Gym_videos/legs1.mp4";
import legs2 from "../assets/Gym_videos/legs2.mp4";

export default function GWorkout() {
  return (
    <PageWrapper>

      {/* MAIN PAGE TITLE */}
      <div className="main-workout-title">Gym Workout</div>

      {/* CHEST */}
      <div className="section-container">
        <div className="section-title">Chest Workout</div>
        <div className="gymworkout-grid">
          <VideoCard videoSrc={chest1} buttonLabel="Dumbbell Bench Press" navigateTo="/AIWorkout" />
          <VideoCard videoSrc={chest2} buttonLabel="Barbell Bench Press" navigateTo="/AIWorkout" />
        </div>
      </div>

      {/* BACK */}
      <div className="section-container">
        <div className="section-title">Back Workout</div>
        <div className="gymworkout-grid">
          <VideoCard videoSrc={back1} buttonLabel="Seated Cable Row" navigateTo="/AIWorkout" />
          <VideoCard videoSrc={back2} buttonLabel="One Arm Dumbbell Row" navigateTo="/AIWorkout" />
          <VideoCard videoSrc={back3} buttonLabel="Lat Pulldown" navigateTo="/AIWorkout" />
        </div>
      </div>

      {/* SHOULDERS */}
      <div className="section-container">
        <div className="section-title">Shoulder Workout</div>
        <div className="gymworkout-grid">
          <VideoCard videoSrc={shoulder1} buttonLabel="Face Pull" navigateTo="/AIWorkout" />
          <VideoCard videoSrc={shoulder2} buttonLabel="Front Dumbbell Raise" navigateTo="/AIWorkout" />
          <VideoCard videoSrc={shoulder3} buttonLabel="Machine Rear Delt Fly" navigateTo="/AIWorkout" />
        </div>
      </div>

      {/* BICEPS */}
      <div className="section-container">
        <div className="section-title">Bicep Workout</div>
        <div className="gymworkout-grid">
          <VideoCard videoSrc={bicep1} buttonLabel="Dumbbell Bicep Curl" navigateTo="/AIWorkout" />
          <VideoCard videoSrc={bicep2} buttonLabel="Concentration Curl" navigateTo="/AIWorkout" />
        </div>
      </div>

      {/* TRICEPS */}
      <div className="section-container">
        <div className="section-title">Tricep Workout</div>
        <div className="gymworkout-grid">
          <VideoCard videoSrc={tricep1} buttonLabel="Cable Tricep Pushdown" navigateTo="/AIWorkout" />
        </div>
      </div>

      {/* LEGS */}
      <div className="section-container">
        <div className="section-title">Legs Workout</div>
        <div className="gymworkout-grid">
          <VideoCard videoSrc={legs1} buttonLabel="Leg Extension" navigateTo="/AIWorkout" />
          <VideoCard videoSrc={legs2} buttonLabel="Squats" navigateTo="/AIWorkout" />
        </div>
      </div>

    </PageWrapper>
  );
}
