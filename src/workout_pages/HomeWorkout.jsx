// src/workout_pages/HomeWorkout.jsx
import React from "react";
import PageWrapper from "./pageWrapper.jsx";
import VideoCard from "../components/VideoCard.jsx";
import "./workout.css";

import video1 from "../assets/videos/video1.mp4";
import video2 from "../assets/videos/video2.mp4";
import video3 from "../assets/videos/video3.mp4";
import video4 from "../assets/videos/video4.mp4";
import video5 from "../assets/videos/video5.mp4";
import video6 from "../assets/videos/video6.mp4";

function HomeWorkout() {
  return (
    <PageWrapper>
      <div className="homeworkout-title">Home Workout</div>

      <div className="homeworkout-grid">
{/* 1️⃣ PLANKS */}
<VideoCard
  videoSrc={video1}
  buttonLabel="🧘 PLANKS"
  navigateTo="/AIWorkout"
  state={{ workoutName: "Planks" }}
/>

       {/* 2️⃣ PUSH UPS */}
<VideoCard
  videoSrc={video2}
  buttonLabel="💪 PUSH UPS"
  navigateTo="/AIWorkout"
  state={{ workoutName: "Push Ups" }}
/>

{/* 3️⃣ SQUATS */}
<VideoCard
  videoSrc={video3}
  buttonLabel="🏋️ SQUATS"
  navigateTo="/AIWorkout"
  state={{ workoutName: "Squats" }}
/>

{/* 4️⃣ BURPEES */}
<VideoCard
  videoSrc={video4}
  buttonLabel="🔥 BURPEES"
  navigateTo="/AIWorkout"
  state={{ workoutName: "Burpees" }}
/>

{/* 5️⃣ LUNGES */}
<VideoCard
  videoSrc={video5}
  buttonLabel="🦵 LUNGES"
  navigateTo="/AIWorkout"
  state={{ workoutName: "Lunges" }}
/>

{/* 6️⃣ PULL UPS */}
<VideoCard
  videoSrc={video6}
  buttonLabel="🧗 PULL UPS"
  navigateTo="/AIWorkout"
  state={{ workoutName: "Pull Ups" }}
/>

      </div>
    </PageWrapper>
  );
}

export default HomeWorkout; 