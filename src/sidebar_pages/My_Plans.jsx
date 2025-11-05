import React from "react";
import {FaHome, FaChartLine, FaDumbbell, FaCog, FaClipboardList,  FaBars} from  "react-icons/fa";// icons for different button
import { GiWeightLiftingUp } from "react-icons/gi";
import { Link } from "react-router-dom";

import "./plans.css";
import PageWrapper from "../workout_pages/pageWrapper.jsx";




function Plans(){
  return (
    <>
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

      <br/><br/><br/><br/>
      {/* Home workout section  */}

      <div>
      <section className='section1 ' > 
              {/* <section className='section1 ' style={{ Left: open ? "250px" : "200px" }}>  */}

        <div id="heading3"><FaHome/></div><br/>

        <p id='para' >
          Train in the confort  of your home with <br/> minimal equipment
        </p>

      

        <Link to="/HWorkout" className="noLink">
          <button className="button1">  HomeWorkout  </button>
        </Link>
      </section>
      
      {/* Gym workout section  */}
      <section  className='section2' >
              {/* <section  className='section2' style={{ Left: open ? "250px" : "200px" }}>  */}
 
        <div  id="heading3" > <GiWeightLiftingUp/> </div> <br/>

        <p id='para' >
          Access a wide range of equipment and <br/>maximize your training
        </p> 

        <Link to="/GWorkout" className="noLink">
          <button  className="button2" >
            GymWorkout
          </button>
        </Link>
      </section>
       </div>
      </div>
    </>
  );
}
export default Plans;