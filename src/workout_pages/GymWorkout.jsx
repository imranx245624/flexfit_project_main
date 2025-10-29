// src/pages/GymWorkout.jsx
import PageWrapper from "./pageWrapper.jsx";
import React from "react";

import VideoCard from "../components/VideoCard.jsx";
import "./workout.css";


import chest1  from "../assets/Gym_videos/chest1.mp4";
import chest2  from "../assets/Gym_videos/chest2.mp4";
import back1  from "../assets/Gym_videos/back1.mp4";
import back2  from "../assets/Gym_videos/back2.mp4";
import back3  from "../assets/Gym_videos/back3.mp4";
import shoulder1  from "../assets/Gym_videos/shoulder1.mp4";
import shoulder2  from "../assets/Gym_videos/shoulder2.mp4";
import shoulder3 from "../assets/Gym_videos/shoulder3.mp4";
import bicep1 from "../assets/Gym_videos/bicep1.mp4";
import bicep2 from "../assets/Gym_videos/bicep2.mp4";
import tricep1 from "../assets/Gym_videos/tricep1.mp4";
import legs1 from "../assets/Gym_videos/legs1.mp4";
import legs2 from "../assets/Gym_videos/legs2.mp4";





export default function GWorkout() {
  return(
    <PageWrapper>
   {/* <h2 id="heading"  >GYM workouts</h2> */}
   <br/><br/>

  <div className="video-label" >
     <label >Chest Workout </label>
   </div>
  <div className="video-grid">
    <VideoCard videoSrc={chest1}  buttonLabel="Dumbbell Bench Press" navigateTo="/AIWorkout" />
    <VideoCard videoSrc={chest2}  buttonLabel="Barbell Bench Press" navigateTo="/AIWorkout" />
  </div>
  <br/><br/><br/><br/><br/>

   <label className="video-label">Back Workout </label> 

  <div className="video-grid">
    <VideoCard videoSrc={back1}  buttonLabel="Seated Cable Row" navigateTo="/AIWorkout" />
    <VideoCard videoSrc={back2}  buttonLabel="One Arm dumbell Row" navigateTo="/AIWorkout" />
    <VideoCard videoSrc={back3}  buttonLabel="Lat Pull Down" navigateTo="/AIWorkout" />
  </div>
  <br/><br/><br/><br/><br/>

  <label className="video-label">Shoulder Workout </label> 
  <div className="video-grid">
    <VideoCard videoSrc={shoulder1}  buttonLabel="Face pull" navigateTo="/AIWorkout" />
    <VideoCard videoSrc={shoulder2}  buttonLabel="Front Dumbell Raise" navigateTo="/AIWorkout" />
    <VideoCard videoSrc={shoulder3}  buttonLabel="Machine Rear delt fly" navigateTo="/AIWorkout" />
  </div>
  <br/><br/><br/><br/><br/>

  <label className="video-label">Bicep Workout </label> 
  <div className="video-grid">
    <VideoCard videoSrc={bicep1}  buttonLabel="Dumbbell bicep curl" navigateTo="/AIWorkout" />
    <VideoCard videoSrc={bicep2}  buttonLabel="Concentration curl" navigateTo="/AIWorkout" />
    
  </div>
  <br/><br/><br/><br/><br/>

    <label className="video-label">Tricep Workout </label>
  <div className="video-grid">
    <VideoCard videoSrc={tricep1}  buttonLabel="cable Row Tricep push down" navigateTo="/AIWorkout" />
   
  </div>
  <br/><br/><br/><br/><br/>

<label className="video-label">Legs Workout </label> 
  <div className="video-grid">
    <VideoCard videoSrc={legs1}  buttonLabel="Leg Extension" navigateTo="/AIWorkout" />
    <VideoCard videoSrc={legs2}  buttonLabel="Squats" navigateTo="/AIWorkout" />
    
  </div>
  


   </PageWrapper>
  
  );
  }
