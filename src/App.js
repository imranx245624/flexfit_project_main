// src/App.js
import React, { useState } from "react";
import {FaHome, FaChartLine, FaDumbbell, FaCog, FaClipboardList,  FaBars} from  "react-icons/fa";// icons for different button
import { GiWeightLiftingUp } from "react-icons/gi";

//import logo from './logo.svg';
import './App.css';
import NavBar from "./NavBar.jsx";
import Sidebar from "./SideBar.jsx";
import {BrowserRouter as Router ,Routes ,Route, Link} from 'react-router-dom';
// for this we have install 'react-router-dom' using command "npm install react-router-dom"

//importing different pages 
import HWorkout from "./workout_pages/HomeWorkout.jsx";
import GWorkout from "./workout_pages/GymWorkout.jsx";
import Workouts from "./sidebar_pages/Workout_library.jsx";
import Plans from "./sidebar_pages/My_Plans.jsx";
import Progress from "./sidebar_pages/Progress_tracker.jsx";
import Settings from "./sidebar_pages/Setting.jsx";



function App() {
  const [open, setOpen] = useState(true);

function HomeContent(){
  return (
    <>
    <div className="headingDiv" >
      <h1 >Choose Your Workout</h1>
      </div>
      {/* Home workout section  */}

      <div>
      <section className='section1' style={{ Left: open ? "250px" : "150px" }}> 
        <div id="heading3"><FaHome/></div><br/>

        <p id='para'>
          Train in the confort  of your home with <br/> minimal equipment
        </p>

        <Link to="/HWorkout" className="noLink">
          <button className="button1">  HomeWorkout  </button>
        </Link>
      </section>
      
      {/* Gym workout section  */}
      <section  className='section2' style={{ Left: open ? "250px" : "150px" }}> 
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
    </>
  );
}


  return (
    <Router>
      
      <NavBar/>
      <Sidebar open={open} setOpen={setOpen} />

      <main className="mainPart"  style={{ marginLeft: open ? "180px" : "50px", transition: "margin-left 1s" }} >
      

        <Routes>
          <Route  path="/" element={<HomeContent />} />
          <Route path="/HWorkout" element={<HWorkout />} />
          <Route path="/GWorkout" element={<GWorkout />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>

      </main>
    </Router>

  );
}

export default App;
