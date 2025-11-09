// src/components/VideoCard.jsx
import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../workout_pages/workout.css";
//import AIWorkout from "./AIWorkout.jsx";

const VideoCard = ({ videoSrc, buttonLabel, navigateTo }) => {
  const videoRef = useRef(null);
  const navigate = useNavigate();

  const handleMouseEnter = () => videoRef.current.play();
  const handleMouseLeave = () => videoRef.current.pause();
  const handleClick = () => navigate(navigateTo);

  return (
    <div className="video-wrapper">
      <div
        className="video-card"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <br/>
        <video
          ref={videoRef}
          src={videoSrc}
          // controls
          muted
          loop
          className="video-element"
        />
        
        </div>
        <br/> 
        <button className="video-button" onClick={handleClick}>{buttonLabel}</button>
    </div>
  );
};

export default VideoCard;
