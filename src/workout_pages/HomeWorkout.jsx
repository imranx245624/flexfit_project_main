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
import video7 from "../assets/videos/video7.mp4";
import video8 from "../assets/videos/video8.mp4";
import video9 from "../assets/videos/video9.mp4";
import video10 from "../assets/videos/video10.mp4";
import video11 from "../assets/videos/video11.mp4";
import video12 from "../assets/videos/video12.mp4";







function HomeWorkout() {
  return (
    <PageWrapper>
      <h2 id="heading" className="page-title">Home Workout</h2>
      <div className="video-grid">
        <VideoCard videoSrc={video1}  buttonLabel="plank" navigateTo="/AIWorkout" />
        <VideoCard videoSrc={video2}  buttonLabel="push-Up" navigateTo="/AIWorkout" />
        <VideoCard videoSrc={video3}  buttonLabel="Calf Raises" navigateTo="/AIWorkout" />
        <VideoCard videoSrc={video4}  buttonLabel="Abs-Workout" navigateTo="/AIWorkout" />
        <VideoCard videoSrc={video5}  buttonLabel="Chin-up" navigateTo="/AIWorkout" />
        <VideoCard videoSrc={video6}  buttonLabel="Pull-up" navigateTo="/AIWorkout" />
        <VideoCard videoSrc={video7}  buttonLabel="Lunges" navigateTo="/AIWorkout" />
        <VideoCard videoSrc={video8}  buttonLabel="Mountain climber" navigateTo="/AIWorkout" />
        <VideoCard videoSrc={video9}  buttonLabel="video9" navigateTo="/AIWorkout" />
        <VideoCard videoSrc={video10} buttonLabel="video10" navigateTo="/AIWorkout" />
        <VideoCard videoSrc={video11} buttonLabel="video11" navigateTo="/AIWorkout" />
        <VideoCard videoSrc={video12} buttonLabel="video12" navigateTo="/AIWorkout" />
        
       


       
      </div>
    </PageWrapper>
  );
}

export default HomeWorkout;
