import React from "react";
import {FaHome, FaChartLine, FaDumbbell, FaCog, FaClipboardList,  FaBars} from  "react-icons/fa";// icons for different button
import { GiWeightLiftingUp } from "react-icons/gi";
import { Link } from "react-router-dom";

import "./plans.css";
import PageWrapper from "../workout_pages/pageWrapper.jsx";

export default function Workouts() {
  return (
    <div> 
    {/* <div style={{ padding: 20,color:'white' }}>
      <h2>Workouts Library</h2>
      <p>Here you can list all workouts (Gym & Home).</p>
    </div> */}
    <div className="Mode_container" >
        <header className="Mode_header" >
          <h1 >Select Workout Mode</h1>
        </header>
    
        <section className="Both_section">
          <div className="page_card">
              <div className="mode_logo">
                <FaHome size={40}/>
              </div>
              <br/><br/>
              <div>
                <p className="para" >
                Train in the confort  of your home with <br/> minimal equipment
              </p>
              </div>
              <div>
                <Link to="/HWorkout" className="">
                  <button className="mode_button">  Home Workout  </button>
                </Link>
              </div>
          </div>
          <div className="page_card">
              <div className="mode_logo">
               <GiWeightLiftingUp  size={40}/>
              </div>
              <br/><br/>
              <div>
                <p className="para" >
                Access a wide range of equipment and <br/>maximize your training
              </p> 
              </div>
              <div>
                <Link to="/GWorkout" className="">
                  <button className="mode_button" > Gym Workout</button>
                </Link>
              </div>
          </div>
        </section>
          </div>
    
   </div>
  );
}
